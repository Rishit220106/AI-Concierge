export async function createSession() {
  return { session_id: crypto.randomUUID() };
}

export async function buildProfile(sessionId, answers) {
  const isHomeAndNoInsurance =
    answers?.goal === 'Buy a home' &&
    answers?.insurance_status === 'No, not yet';

  const isGrowthAndHasInsurance =
    answers?.goal === 'Grow my investments' &&
    answers?.insurance_status === 'Yes, covered';

  if (isHomeAndNoInsurance) {
    return {
      session_id: sessionId,
      profile: {
        archetype_name: 'Goal-saver',
        goal: answers.goal,
        age_bracket: answers.age_bracket,
        investment_status: answers.investment_status,
        insurance_status: answers.insurance_status,
        risk_profile: 'Moderate risk'
      },
      gaps: [
        {
          gap_type: 'no_term_insurance',
          title: 'No term insurance',
          explanation: 'Critical before taking a home loan. EMI commitment without cover is high-risk.',
          urgency: 'critical'
        },
        {
          gap_type: 'no_home_loan_awareness',
          title: 'No home loan awareness',
          explanation: "You don't know your eligibility yet. Get this before shortlisting properties.",
          urgency: 'high'
        }
      ],
      recommendations: [
        {
          product_id: 'et_home_loan',
          product_name: 'ET Home Loan',
          priority: 1,
          reason: 'You are planning a home purchase and need to compare loan options and EMI eligibility.',
          match_tag: 'HOME PURCHASE · IMMEDIATE NEED',
          cta_text: 'CHECK ELIGIBILITY',
          is_top_pick: true
        },
        {
          product_id: 'et_term_insurance',
          product_name: 'ET Term Insurance',
          priority: 2,
          reason: 'Before taking a home loan, financial protection is critical to secure your EMI obligations.',
          match_tag: 'CRITICAL RISK COVER',
          cta_text: 'GET QUOTE',
          is_top_pick: false
        }
      ],
      archetype: {
        name: 'Goal-saver',
        description: 'Planning a home purchase with savings; protection and loan readiness matter.',
        health_scores: { insurance: 2, tax_efficiency: 3, investments: 3, savings_habit: 4 }
      }
    };
  }

  if (isGrowthAndHasInsurance) {
    return {
      session_id: sessionId,
      profile: {
        archetype_name: 'Wealth-builder',
        goal: answers.goal,
        age_bracket: answers.age_bracket,
        investment_status: answers.investment_status,
        insurance_status: answers.insurance_status,
        risk_profile: 'Moderate risk'
      },
      gaps: [
        {
          gap_type: 'low_diversification',
          title: 'Low diversification',
          explanation: 'Your portfolio may be concentrated; broader diversification can improve risk-adjusted returns.',
          urgency: 'high'
        },
        {
          gap_type: 'lack_of_research_depth',
          title: 'Lack of research depth',
          explanation: 'Advanced investing requires deeper research and market context.',
          urgency: 'medium'
        }
      ],
      recommendations: [
        {
          product_id: 'et_prime',
          product_name: 'ET Prime',
          priority: 1,
          reason: 'You already have a portfolio but need deeper research and global market insights to improve diversification.',
          match_tag: 'ADVANCED INVESTOR · NEEDS RESEARCH',
          cta_text: 'EXPLORE ET PRIME',
          is_top_pick: true
        },
        {
          product_id: 'et_term_insurance',
          product_name: 'ET Partner · Term Insurance',
          priority: 2,
          reason: 'Keep your protection plan up to date as your investments grow and liabilities change.',
          match_tag: 'PROTECTION REVIEW',
          cta_text: 'REVIEW COVER',
          is_top_pick: false
        }
      ],
      archetype: {
        name: 'Wealth-builder',
        description: 'Portfolio-focused user seeking higher-quality research and risk management.',
        health_scores: { insurance: 4, tax_efficiency: 3, investments: 4, savings_habit: 4 }
      }
    };
  }

  return {
    session_id: sessionId,
    answers
  };
}

export async function sendChatMessage(sessionId, message) {
  return {
    session_id: sessionId,
    response: "Backend is disconnected for demo mode. You're seeing local fallback behavior."
  };
}
