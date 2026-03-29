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
if ANTHROPIC_API_KEY and not ANTHROPIC_API_KEY.startswith("sk-ant-..."):
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
else:
    client = None

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
      "reason": "Model old vs new regime and find ₹15,000–20,000 in annual tax savings.",
      "match_tag": "TAX EFFICIENCY GAP DETECTED",
      "cta_text": "Try Tax Wizard",
      "is_top_pick": False
    },
    {
      "product_id": "et_term_insurance",
      "product_name": "ET Partner · Term Insurance",
      "priority": 3,
      "reason": "Get a ₹1 crore term cover quote before your home loan EMIs begin.",
      "match_tag": "NO COVERAGE BEFORE EMI COMMITMENT",
      "cta_text": "Get Quote",
      "is_top_pick": False
    }
]

# Agents
def run_agent1(answers: UserAnswers) -> dict:
    if not client: return FALLBACK_PROFILE
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=600,
            system='''You are a financial profiling AI for Economic Times.
Given a user's 4 answers, extract a structured profile.
Respond ONLY with valid JSON. No markdown, no explanation.

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
  "archetype_description": "Investing with a clear near-term target. Needs goal-aligned tools, tax efficiency, and milestone tracking."
}

life_stage options: "first_timer" | "goal_saver" | "wealth_builder" | "pre_retiree" | "corporate_professional" | "entrepreneur"
income_signal: infer from age + investment status: "low" | "mid" | "high"
risk_profile: infer from goal + age: "conservative" | "moderate" | "aggressive"
If career_focus is 'Career growth', set professional_vertical based on any context clues. Default to 'none' if unclear.
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
        return json.loads(response.content[0].text)
    except Exception as e:
        print(f"Agent 1 error: {e}")
        return FALLBACK_PROFILE

def run_agent2(profile: dict) -> list:
    if not client: return FALLBACK_GAPS
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=800,
            system='''You are a financial gap analysis AI for Economic Times.
Given a user profile, identify their top financial gaps.
Respond ONLY with valid JSON. No markdown, no explanation.

Output this exact structure — an array of gap objects:
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
        return json.loads(response.content[0].text)
    except Exception as e:
        print(f"Agent 2 error: {e}")
        return FALLBACK_GAPS

def run_agent3(profile: dict, gaps: list) -> list:
    if not client: return FALLBACK_RECOMMENDATIONS
    ET_PRODUCT_CATALOGUE = """
ET PRODUCT CATALOGUE — FULL ECOSYSTEM:

1. ET Prime
   id: et_prime
   description: Premium research — Prime Shots (quick insights),
   Prime Vantage (expert blogs), Prime Decoder (regulatory analysis),
   Stock Reports Plus, Big Bull Portfolio tracker,
   Stock Analyzer (30+ parameters), ET Wealth edition included.
   best_for: goal_saver, wealth_builder, pre_retiree, 
             home_purchase, any_goal
   cta: "Explore ET Prime"

2. ET Markets
   id: et_markets
   description: Live Sensex/Nifty, Screener Plus, Market Pulse,
   Market Mood (fear/greed), 20+ technical indicators,
   Free Live TV via ET NOW. SIP tracker, stock screener.
   best_for: wealth_builder, has_sips, has_portfolio
   cta: "Open ET Markets"

3. ET Money Genius
   id: et_money_genius
   description: Commission-free SIP investing, Aadhaar OTP onboarding.
   Genius tier: dynamic asset allocation across equity/gold/debt,
   monthly auto-rebalancing, investor personality diagnostic.
   Manages ₹28,000 crore in assets. Acquired by 360 ONE Wealth.
   best_for: first_timer, goal_saver, has_sips, just_starting_out
   cta: "Try ET Money"

4. ET Wealth Tools
   id: et_wealth_tools
   description: Tax Saving Maximizer, SIP/FD/EPF calculators,
   insurance guides, property & loan advice, 
   FREE credit score check, retirement planning tools.
   best_for: goal_saver, pre_retiree, home_purchase,
             unused_80c gap, no_credit_score_awareness
   cta: "Open ET Wealth"

5. ET Wealth — Free Credit Score
   id: et_credit_score
   description: Free CIBIL credit score check via ET Wealth.
   Critical before applying for a home loan. 60% of home loan
   applications rejected due to poor CIBIL score.
   best_for: home_purchase goal, no_home_loan_awareness gap
   cta: "Check Free Credit Score"

6. ET Partner — Term Insurance
   id: et_term_insurance
   description: ₹1 Cr term cover quotes, compare insurers,
   instant eligibility. From ₹700/month for 25-35 age bracket.
   Critical before EMI commitment.
   best_for: no_term_insurance gap, home_purchase goal
   cta: "Get Quote"

7. ET Partner — Home Loan Comparison
   id: et_home_loan
   description: Compare home loan rates across 20+ banks,
   eligibility check, EMI calculator.
   best_for: home_purchase goal, no_home_loan_awareness gap
   cta: "Check Eligibility"

8. ET Money — NPS & FD
   id: et_nps_fd
   description: National Pension Scheme portal (world's
   lowest-cost pension). High-interest FDs from Bajaj Finance,
   Shriram Finance. DICGC insured up to ₹5 lakh.
   best_for: pre_retiree, no_retirement_planning gap
   cta: "Start NPS"

9. ET Money Mentor
   id: et_money_mentor
   description: SIP recommendations for beginners, first
   investment guide, explainer-first financial content.
   best_for: first_timer, just_starting_out, under_25
   cta: "Start Learning"

10. ET Edge — Masterclasses & Summits
    id: et_edge
    description: Masterclasses by Dr. Ram Charan, Seth Godin
    on negotiation, business storytelling, financial strategy.
    Global Business Summit (2000+ leaders). GCC, SCM, ESG summits.
    best_for: corporate_professional, entrepreneur, career_focus
    cta: "Explore ET Edge"

11. ETHRWorld
    id: et_hrworld
    description: HR community platform. CHRO Club (Infosys, Amazon,
    Tata Motors). Future Forward Summits. Global Learning & Skilling
    Report. For HR leaders and talent professionals.
    best_for: professional_vertical=hr, career_focus
    cta: "Join ETHRWorld"

12. ETCIO
    id: et_cio
    description: Tech leadership platform. CIO Annual Conclave,
    AI Playbook Index, CIO Satisfaction Survey, DeepTalks series.
    For CIOs, CTOs, and enterprise tech leaders.
    best_for: professional_vertical=tech, career_focus
    cta: "Explore ETCIO"

13. ETBrandEquity
    id: et_brandequity
    description: Marketing & media platform for 2M+ professionals.
    Brand World Summit, The Shark Awards, Seth Godin masterclasses.
    For CMOs, brand managers, marketing leaders.
    best_for: professional_vertical=marketing, career_focus
    cta: "Explore ETBrandEquity"

14. ET Vernacular
    id: et_vernacular
    description: ET business news in 8 Indian languages:
    Hindi, Gujarati, Marathi, Bengali, Tamil, Malayalam,
    Telugu, Kannada. Same depth as English ET.
    best_for: regional_investor, prefers_regional_language
    cta: "Read in Your Language"

15. ET Markets — Stock Screener Plus
    id: et_screener_plus
    description: Filter stocks on 30+ fundamental and technical
    parameters. Market Mood indicator (fear/greed). 
    For active equity investors.
    best_for: wealth_builder, aggressive risk profile, has_portfolio
    cta: "Open Screener Plus"
"""
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=f'''You are the ET product matching AI for Economic Times.
Given a user profile and their financial gaps, select the most relevant ET products for them.
Respond ONLY with valid JSON. No markdown, no explanation.

{ET_PRODUCT_CATALOGUE}

Output this exact structure — array of 3-4 recommendations:
[
  {{
    "product_id": "et_prime",
    "product_name": "ET Prime",
    "priority": 1,
    "reason": "Access deep-dive home buying guides and property market analysis built for first-time buyers.",
    "match_tag": "MATCHES YOUR HOME PURCHASE GOAL · 2-3 YR HORIZON",
    "cta_text": "Explore ET Prime",
    "is_top_pick": true
  }}
]

Rules:
- is_top_pick: true for priority 1 only
- match_tag: SHORT uppercase reason, max 8 words, explain WHY this matches THIS user specifically
- reason: 1-2 sentences, mention the user's specific goal/gap
- Return exactly 3-4 products, priority 1 being most important
- Always address the highest severity gap first

ROUTING RULES:
- If career_focus = 'Career growth' AND professional_vertical = 'hr' → include ETHRWorld
- If career_focus = 'Career growth' AND professional_vertical = 'tech' → include ETCIO  
- If career_focus = 'Career growth' AND professional_vertical = 'marketing' → include ETBrandEquity
- If career_focus = 'Career growth' (any) → include ET Edge
- If goal = home_purchase → always include et_credit_score
- If life_stage = first_timer → always include et_money_mentor
- If life_stage = pre_retiree → always include et_nps_fd
- If insurance_status = no_insurance → severity 5 gap, always include et_term_insurance as priority 1 or 2
- Return 4-5 recommendations (not 3) when career_focus is also present alongside financial gaps
''',
            messages=[{
                "role": "user",
                "content": f"User profile: {json.dumps(profile)}\nUser gaps: {json.dumps(gaps)}\n\nReturn the 3-4 most relevant ET products for this user as JSON."
            }]
        )
        return json.loads(response.content[0].text)
    except Exception as e:
        print(f"Agent 3 error: {e}")
        return FALLBACK_RECOMMENDATIONS

def calculate_health_scores(profile: dict, gaps: list) -> dict:
    scores = {"insurance": 4, "tax_efficiency": 4, "investments": 4, "savings_habit": 4}
    
    # Insurance
    if profile.get('insurance_status') == "no_insurance":
        scores['insurance'] = 2
    
    # Tax Efficiency
    has_80c_gap = any('80c' in gap.get('gap_type', '').lower() for gap in gaps)
    if has_80c_gap:
        scores['tax_efficiency'] = 2
        
    # Investments
    inv_status = profile.get('investment_status', '')
    if inv_status == 'has_sips':
        scores['investments'] = 3
    elif inv_status == 'just_starting':
        scores['investments'] = 2
        
    # Savings habit
    if inv_status in ['has_sips', 'has_portfolio']:
        scores['savings_habit'] = 4
    elif inv_status == 'just_starting':
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
def build_profile(req: ProfileBuildRequest):
    if req.session_id not in sessions:
        sessions[req.session_id] = {
            "session_id": req.session_id,
            "created_at": datetime.now().isoformat()
        }
    
    start_time = time.time()
    
    profile = run_agent1(req.answers)
    gaps = run_agent2(profile)
    recommendations = run_agent3(profile, gaps)
    
    health_scores = calculate_health_scores(profile, gaps)
    
    archetype = {
        "name": profile.get("archetype_name", "Goal-saver"),
        "description": profile.get("archetype_description", ""),
        "health_scores": health_scores
    }
    
    sessions[req.session_id].update({
        "answers": req.answers.dict(),
        "profile": profile,
        "gaps": gaps,
        "recommendations": recommendations,
        "archetype": archetype
    })
    
    return {
        "session_id": req.session_id,
        "profile": profile,
        "gaps": gaps,
        "recommendations": recommendations,
        "archetype": archetype,
        "processing_time_ms": int((time.time() - start_time) * 1000)
    }

@app.get("/profile/{session_id}")
def get_profile(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]

@app.post("/chat/message")
def chat_message(req: ChatRequest):
    if req.session_id not in sessions or not sessions[req.session_id].get("profile"):
        return {"response": "I don't have your profile yet. Please complete the onboarding first."}
    
    profile = sessions[req.session_id]["profile"]
    
    if not client:
        return {"response": "I'm offline right now, but I'd recommend exploring ET Prime for deeper market insights."}
        
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=400,
            system=f'''You are ET AI Concierge, a friendly financial guide for Economic Times users in India.
You know this user's profile: {json.dumps(profile)}
Answer their question in 2-3 sentences max.
Be specific to their profile — mention their goal, gaps, or recommended ET products where relevant.
Use simple language. No jargon. Be warm and direct.
Always end with one actionable next step from ET's ecosystem.''',
            messages=[{
                "role": "user",
                "content": req.message
            }]
        )
        return {"response": response.content[0].text}
    except Exception as e:
        print(f"Chat error: {e}")
        return {"response": "I'm having trouble connecting right now, but you should definitely start by checking out your top recommendation! Take a look at ET Money Genius or ET Edge alongside your dashboard tailored hits."}

@app.post("/crosssell/trigger")
def crosssell_trigger(req: CrossSellRequest):
    # Rule-based, NO Claude call needed
    event = req.behaviour_event.lower()
    if "real_estate" in event:
        return {"nudge": {"product": "ET Home Loan", "message": "Planning a purchase? Calculate your EMI and check eligibility instantly.", "cta": "Check Eligibility"}}
    elif "tax" in event:
        return {"nudge": {"product": "ET Tax Wizard", "message": "Did you know you can optimize your 80C? Try the Tax Wizard.", "cta": "Try Tax Wizard"}}
    elif "market" in event:
        return {"nudge": {"product": "ET Markets", "message": "Track these stocks directly in ET Markets SIP tracker.", "cta": "Open ET Markets"}}
    elif "insurance" in event:
        return {"nudge": {"product": "ET Term Insurance", "message": "Protect your family's future before making big financial commitments.", "cta": "Get Quote"}}
    
    return {"nudge": {"product": "ET Prime", "message": "Get deeper insights into these topics with ET Prime.", "cta": "Explore ET Prime"}}

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
