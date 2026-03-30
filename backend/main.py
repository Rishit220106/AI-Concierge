import os
import json
import uuid
import time
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    print(f"Anthropic client initialized successfully")
else:
    client = None
    print("WARNING: No API key found - running in fallback mode")

# Simple in-memory dict for session storage
sessions = {}

# Data Models
class UserAnswers(BaseModel):
    goal: str
    investment_status: str
    age_bracket: str
    insurance_status: str
    career_focus: str

class ProfileBuildRequest(BaseModel):
    session_id: str
    answers: UserAnswers

class ChatRequest(BaseModel):
    session_id: str
    message: str

class CrossSellRequest(BaseModel):
    session_id: str
    behaviour_event: str

# Fallbacks
FALLBACK_PROFILE = {
    "age_bracket": "25-35",
    "goal": "home_purchase",
    "investment_status": "has_sips",
    "insurance_status": "no_insurance",
    "income_signal": "mid",
    "risk_profile": "moderate",
    "life_stage": "goal_saver",
    "archetype_name": "Goal-saver",
    "archetype_description": "Investing with a clear near-term target. Needs goal-aligned tools, tax efficiency, and milestone tracking."
}

FALLBACK_GAPS = [
    {
      "gap_type": "no_term_insurance",
      "severity": 5,
      "title": "No term insurance",
      "explanation": "Critical before taking a home loan. EMI commitment without cover is high-risk.",
      "urgency": "critical"
    },
    {
      "gap_type": "unused_80c_capacity",
      "severity": 4,
      "title": "Unused 80C capacity",
      "explanation": "Your SIPs don't fully utilise your tax-saving room.",
      "urgency": "high"
    },
    {
      "gap_type": "no_home_loan_awareness",
      "severity": 3,
      "title": "No home loan awareness",
      "explanation": "You don't know your eligibility yet. Get this before shortlisting properties.",
      "urgency": "medium"
    }
]

FALLBACK_RECOMMENDATIONS = [
    {
      "product_id": "et_prime",
      "product_name": "ET Prime",
      "priority": 1,
      "reason": "Access deep-dive home buying guides and property market analysis built for first-time buyers.",
      "match_tag": "MATCHES YOUR HOME PURCHASE GOAL",
      "cta_text": "Explore ET Prime",
      "is_top_pick": True
    },
    {
      "product_id": "et_tax_wizard",
      "product_name": "ET Tax Wizard",
      "priority": 2,
      "reason": "Model old vs new regime and find Rs 15,000-20,000 in annual tax savings.",
      "match_tag": "TAX EFFICIENCY GAP DETECTED",
      "cta_text": "Try Tax Wizard",
      "is_top_pick": False
    },
    {
      "product_id": "et_term_insurance",
      "product_name": "ET Partner - Term Insurance",
      "priority": 3,
      "reason": "Get a Rs 1 crore term cover quote before your home loan EMIs begin.",
      "match_tag": "NO COVERAGE BEFORE EMI COMMITMENT",
      "cta_text": "Get Quote",
      "is_top_pick": False
    }
]

# Agents
async def run_agent1(answers: UserAnswers) -> dict:
    print(f"Agent 1 running with answers: goal={answers.goal} investment_status={answers.investment_status} age_bracket={answers.age_bracket} insurance_status={answers.insurance_status} career_focus={answers.career_focus}")
    if not client:
        print("Agent 1: no client, returning fallback")
        return FALLBACK_PROFILE
    raw_text = None
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=600,
            system='''You are a financial profiling AI for Economic Times.
Given a user's answers, extract a structured profile.
Respond ONLY with valid JSON. No markdown, no explanation, no code blocks.

Output this exact JSON structure:
{
  "age_bracket": "25-35",
  "goal": "home_purchase",
  "investment_status": "has_sips",
  "insurance_status": "no_insurance",
  "income_signal": "mid",
  "risk_profile": "moderate",
  "life_stage": "goal_saver",
  "archetype_name": "Goal-saver",
  "archetype_description": "Investing with a clear near-term target. Needs goal-aligned tools, tax efficiency, and milestone tracking.",
  "career_focus": "financial",
  "professional_vertical": "none"
}

goal options: "home_purchase" | "grow_investments" | "retirement" | "first_timer"
life_stage options: "first_timer" | "goal_saver" | "wealth_builder" | "pre_retiree" | "corporate_professional" | "entrepreneur"
income_signal: "low" | "mid" | "high"
risk_profile: "conservative" | "moderate" | "aggressive"
career_focus: "financial" | "career" | "both"
professional_vertical: "hr" | "tech" | "marketing" | "none"
''',
            messages=[{
                "role": "user",
                "content": f"""User answers:
Goal: {answers.goal}
Investment status: {answers.investment_status}
Age bracket: {answers.age_bracket}
Insurance: {answers.insurance_status}
Career Focus: {answers.career_focus}

Extract their financial profile as JSON."""
            }]
        )
        raw_text = response.content[0].text.strip()
        print(f"Agent 1 raw response: {raw_text}")
        # Strip markdown code blocks if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        result = json.loads(raw_text)
        return result
    except json.JSONDecodeError as e:
        print(f"Agent 1 JSON parse error: {e}")
        print(f"Agent 1 raw text was: {raw_text}")
        return FALLBACK_PROFILE
    except Exception as e:
        print(f"Agent 1 exception: {type(e).__name__}: {e}")
        return FALLBACK_PROFILE

async def run_agent2(profile: dict) -> list:
    print(f"Agent 2 running with profile life_stage={profile.get('life_stage')} goal={profile.get('goal')}")
    if not client:
        print("Agent 2: no client, returning fallback")
        return FALLBACK_GAPS
    raw_text = None
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=800,
            system='''You are a financial gap analysis AI for Economic Times.
Given a user profile, identify their top financial gaps.
Respond ONLY with valid JSON array. No markdown, no explanation, no code blocks.

Output this exact structure:
[
  {
    "gap_type": "no_term_insurance",
    "severity": 5,
    "title": "No term insurance",
    "explanation": "Critical before taking a home loan. EMI commitment without cover is high-risk.",
    "urgency": "critical"
  }
]

severity: 1 (minor) to 5 (critical)
urgency: "critical" | "high" | "medium" | "low"

Common gaps to check for:
- no_term_insurance (critical if no_insurance + has/planning loan)
- unused_80c_capacity (if has_sips but not maxing tax savings)
- no_home_loan_awareness (if goal=home_purchase)
- sip_horizon_mismatch (if equity SIPs for short <3yr goal)
- no_emergency_fund (if just_starting_out)
- under_insured (if has insurance but low income signal)
- no_retirement_planning (if age 35+ and goal is not retirement)

Return 3-5 gaps maximum, ordered by severity descending.
''',
            messages=[{
                "role": "user",
                "content": f"User profile: {json.dumps(profile)}\n\nIdentify their financial gaps as JSON array."
            }]
        )
        raw_text = response.content[0].text.strip()
        print(f"Agent 2 raw response: {raw_text}")
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"Agent 2 JSON parse error: {e}, raw: {raw_text}")
        return FALLBACK_GAPS
    except Exception as e:
        print(f"Agent 2 exception: {type(e).__name__}: {e}")
        return FALLBACK_GAPS

async def run_agent3(profile: dict, gaps: list) -> list:
    print(f"Agent 3 running with {len(gaps)} gaps for life_stage={profile.get('life_stage')}")
    if not client:
        print("Agent 3: no client, returning fallback")
        return FALLBACK_RECOMMENDATIONS
    ET_PRODUCT_CATALOGUE = """
ET PRODUCT CATALOGUE:

1. ET Prime | id: et_prime | Deep research, home buying guides, stock analysis | best_for: any goal | cta: "Explore ET Prime"
2. ET Markets | id: et_markets | Live stocks, SIP tracker, screener | best_for: has_sips, has_portfolio | cta: "Open ET Markets"
3. ET Money Genius | id: et_money_genius | Commission-free SIP, auto-rebalancing, Rs28000Cr AUM | best_for: first_timer, goal_saver | cta: "Try ET Money"
4. ET Wealth Tools | id: et_wealth_tools | Tax maximizer, calculators, credit score | best_for: goal_saver, pre_retiree | cta: "Open ET Wealth"
5. ET Credit Score | id: et_credit_score | Free CIBIL check, critical before home loan | best_for: home_purchase | cta: "Check Free Credit Score"
6. ET Term Insurance | id: et_term_insurance | Rs1Cr cover from Rs700/month | best_for: no_insurance gap | cta: "Get Quote"
7. ET Home Loan | id: et_home_loan | Compare 20+ banks, EMI calculator | best_for: home_purchase | cta: "Check Eligibility"
8. ET NPS & FD | id: et_nps_fd | Pension + high-interest FDs | best_for: pre_retiree | cta: "Start NPS"
9. ET Money Mentor | id: et_money_mentor | Beginner SIP guide | best_for: first_timer | cta: "Start Learning"
10. ET Edge | id: et_edge | Masterclasses, summits, Dr Ram Charan | best_for: career_focus | cta: "Explore ET Edge"
11. ETHRWorld | id: et_hrworld | HR community, CHRO Club | best_for: professional_vertical=hr | cta: "Join ETHRWorld"
12. ETCIO | id: et_cio | Tech leadership, CIO Conclave | best_for: professional_vertical=tech | cta: "Explore ETCIO"
13. ETBrandEquity | id: et_brandequity | Marketing platform, Brand World Summit | best_for: professional_vertical=marketing | cta: "Explore ETBrandEquity"
14. ET Vernacular | id: et_vernacular | News in 8 Indian languages | best_for: regional | cta: "Read in Your Language"
15. ET Screener Plus | id: et_screener_plus | 30+ stock filters, Market Mood | best_for: wealth_builder | cta: "Open Screener Plus"
"""
    raw_text = None
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=f'''You are the ET product matching AI for Economic Times.
Given a user profile and their financial gaps, select the most relevant ET products.
Respond ONLY with valid JSON array. No markdown, no explanation, no code blocks.

{ET_PRODUCT_CATALOGUE}

Output this exact structure:
[
  {{
    "product_id": "et_prime",
    "product_name": "ET Prime",
    "priority": 1,
    "reason": "One or two sentences specific to this user's goal and gaps.",
    "match_tag": "SHORT UPPERCASE REASON MAX 8 WORDS",
    "cta_text": "Explore ET Prime",
    "is_top_pick": true
  }}
]

ROUTING RULES — follow strictly:
- career_focus=career AND professional_vertical=hr → include et_hrworld
- career_focus=career AND professional_vertical=tech → include et_cio
- career_focus=career AND professional_vertical=marketing → include et_brandequity
- career_focus=career (any) → include et_edge
- goal=home_purchase → include et_credit_score
- life_stage=first_timer → include et_money_mentor
- life_stage=pre_retiree → include et_nps_fd
- insurance_status=no_insurance → include et_term_insurance as priority 1 or 2
- Return 4-5 products when career_focus is present, 3-4 otherwise
- is_top_pick: true for priority 1 ONLY
''',
            messages=[{
                "role": "user",
                "content": f"User profile: {json.dumps(profile)}\nUser gaps: {json.dumps(gaps)}\n\nReturn the most relevant ET products for this user as JSON array."
            }]
        )
        raw_text = response.content[0].text.strip()
        print(f"Agent 3 raw response: {raw_text}")
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"Agent 3 JSON parse error: {e}, raw: {raw_text}")
        return FALLBACK_RECOMMENDATIONS
    except Exception as e:
        print(f"Agent 3 exception: {type(e).__name__}: {e}")
        return FALLBACK_RECOMMENDATIONS

def calculate_health_scores(profile: dict, gaps: list) -> dict:
    scores = {"insurance": 4, "tax_efficiency": 4, "investments": 3, "savings_habit": 4}
    if profile.get('insurance_status') == "no_insurance":
        scores['insurance'] = 2
    has_80c_gap = any('80c' in gap.get('gap_type', '').lower() for gap in gaps)
    if has_80c_gap:
        scores['tax_efficiency'] = 2
    inv_status = profile.get('investment_status', '')
    if inv_status == 'has_sips':
        scores['investments'] = 3
    elif inv_status in ['just_starting', 'first_timer']:
        scores['investments'] = 2
    if inv_status in ['has_sips', 'has_portfolio']:
        scores['savings_habit'] = 4
    elif inv_status in ['just_starting', 'first_timer']:
        scores['savings_habit'] = 2
    return scores

# Endpoints
@app.post("/session/create")
def create_session():
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "session_id": session_id,
        "answers": {},
        "profile": {},
        "gaps": [],
        "recommendations": [],
        "archetype": {},
        "created_at": datetime.now().isoformat()
    }
    return {"session_id": session_id}

@app.post("/profile/build")
async def profile_build(request: ProfileBuildRequest):
    start = time.time()
    print(f"\n--- Building profile for session {request.session_id} ---")

    profile = await run_agent1(request.answers)
    gaps = await run_agent2(profile)
    recommendations = await run_agent3(profile, gaps)
    health_scores = calculate_health_scores(profile, gaps)

    processing_time_ms = int((time.time() - start) * 1000)
    print(f"--- Profile built in {processing_time_ms}ms ---\n")

    result = {
        "session_id": request.session_id,
        "profile": profile,
        "gaps": gaps,
        "recommendations": recommendations,
        "archetype": {
            "name": profile.get("archetype_name", "Goal-saver"),
            "description": profile.get("archetype_description", ""),
            "health_scores": health_scores
        },
        "processing_time_ms": processing_time_ms
    }

    sessions[request.session_id] = result
    return result

@app.get("/profile/{session_id}")
def get_profile(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]

@app.post("/chat/message")
async def chat_message(req: ChatRequest):
    if req.session_id not in sessions or not sessions[req.session_id].get("profile"):
        return {"response": "I don't have your profile yet. Please complete the onboarding first."}
    profile = sessions[req.session_id]["profile"]
    if not client:
        return {"response": "Based on your profile, I'd recommend starting with your highest-priority gap first."}
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=400,
            system=f'''You are ET AI Concierge, a friendly financial guide for Economic Times users in India.
You know this user profile: {json.dumps(profile)}
Answer in 2-3 sentences max. Be specific to their profile.
Use simple language. No jargon. Be warm and direct.
Always end with one actionable next step from ET ecosystem.''',
            messages=[{"role": "user", "content": req.message}]
        )
        return {"response": response.content[0].text}
    except Exception as e:
        print(f"Chat error: {e}")
        return {"response": "Based on your profile, I'd recommend starting with your highest-priority gap first. Would you like me to guide you?"}

@app.post("/crosssell/trigger")
def crosssell_trigger(req: CrossSellRequest):
    event = req.behaviour_event.lower()
    if "real_estate" in event:
        return {"nudge": {"product": "ET Home Loan", "message": "Planning a purchase? Calculate your EMI and check eligibility instantly.", "cta": "Check Eligibility"}}
    elif "tax" in event:
        return {"nudge": {"product": "ET Tax Wizard", "message": "Did you know you can optimize your 80C? Try the Tax Wizard.", "cta": "Try Tax Wizard"}}
    elif "market" in event:
        return {"nudge": {"product": "ET Markets", "message": "Track these stocks directly in ET Markets SIP tracker.", "cta": "Open ET Markets"}}
    elif "insurance" in event:
        return {"nudge": {"product": "ET Term Insurance", "message": "Protect your family's future before making big financial commitments.", "cta": "Get Quote"}}
    return {"nudge": {"product": "ET Prime", "message": "Get deeper insights with ET Prime.", "cta": "Explore ET Prime"}}

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat(), "client_ready": client is not None}