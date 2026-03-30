import React, { useState, useEffect, useRef } from 'react';
import { createSession, buildProfile, sendChatMessage } from './api';

const PRODUCT_URLS = {
  et_prime: 'https://economictimes.indiatimes.com/prime',
  et_markets: 'https://economictimes.indiatimes.com/markets',
  et_markets_sip: 'https://economictimes.indiatimes.com/markets',
  et_money_genius: 'https://www.etmoney.com/',
  et_wealth_tools: 'https://economictimes.indiatimes.com/wealth',
  et_tax_wizard: 'https://economictimes.indiatimes.com/wealth/tax',
  et_credit_score: 'https://economictimes.indiatimes.com/wealth',
  et_term_insurance: 'https://economictimes.indiatimes.com/wealth/insure/life-insurance',
  et_home_loan: 'https://economictimes.indiatimes.com/wealth/borrow/home-loan',
  et_nps_fd: 'https://www.etmoney.com/nps',
  et_money_mentor: 'https://www.etmoney.com/learn',
  et_edge: 'https://et-edge.com/',
  et_hrworld: 'https://hr.economictimes.indiatimes.com/',
  et_cio: 'https://cio.economictimes.indiatimes.com/',
  et_brandequity: 'https://brandequity.economictimes.indiatimes.com/',
  et_vernacular: 'https://hindi.economictimes.com/',
  et_screener_plus: 'https://economictimes.indiatimes.com/markets/stocks/stock-screener'
};

const FALLBACK_PROFILE = {
  archetype_name: "Goal-saver",
  goal: "Home purchase · 2–3 yrs",
  age_bracket: "Age 25–30",
  risk_profile: "Moderate risk",
  insurance_status: "No term insurance"
};

const FALLBACK_ARCHETYPE = {
  name: "Goal-saver",
  description: "Investing with a clear near-term target. Needs goal-aligned tools, tax efficiency, and milestone tracking.",
  health_scores: { insurance: 2, tax_efficiency: 3, investments: 3, savings_habit: 4 }
};

const FALLBACK_RECOMMENDATIONS = [
  {
    product_id: "et_prime",
    product_name: "ET Prime",
    reason: "Access ET's deep-dive home buying guides, property market analysis, and loan eligibility calculators built for first-time buyers.",
    match_tag: "MATCHES YOUR HOME PURCHASE GOAL · 2–3 YR HORIZON",
    cta_text: "EXPLORE ET PRIME",
    is_top_pick: true
  },
  {
    product_id: "et_tax_wizard",
    product_name: "ET Tax Wizard",
    reason: "You have unused 80C capacity beyond your current SIPs. Model old vs new regime and find ₹15,000–20,000 in annual tax savings.",
    match_tag: "TAX EFFICIENCY GAP DETECTED IN YOUR PROFILE",
    cta_text: "TRY TAX WIZARD",
    is_top_pick: false
  },
  {
    product_id: "et_term_insurance",
    product_name: "ET Partner · Term Insurance",
    reason: "Get a ₹1 crore term cover quote before your home loan EMIs begin. Starting at ₹700/month for your age bracket.",
    match_tag: "CRITICAL GAP · NO COVERAGE BEFORE EMI COMMITMENT",
    cta_text: "GET QUOTE",
    is_top_pick: false
  },
  {
    product_id: "et_markets_sip",
    product_name: "ET Markets · SIP Tracker",
    reason: "Check if your existing SIPs are aligned to a 2–3 year horizon or over-exposed to equity for your goal timeline.",
    match_tag: "HORIZON MISMATCH RISK IN CURRENT SIP ALLOCATION",
    cta_text: "OPEN ET MARKETS",
    is_top_pick: false
  }
];

const FALLBACK_GAPS = [
  {
    gap_type: "insurance",
    title: "No term insurance",
    explanation: "critical before taking a home loan. EMI commitment without cover is high-risk.",
    urgency: "critical"
  },
  {
    gap_type: "tax",
    title: "Unused 80C capacity",
    explanation: "your SIPs don't fully utilise your tax-saving room. ~₹18,000 savings possible.",
    urgency: "critical"
  },
  {
    gap_type: "home_loan",
    title: "No home loan awareness",
    explanation: "you don't know your eligibility yet. Get this before shortlisting properties.",
    urgency: "high"
  },
  {
    gap_type: "sip",
    title: "SIP horizon mismatch",
    explanation: "equity SIPs for a 2–3 yr goal carry higher short-term volatility risk.",
    urgency: "low"
  }
];

const ProductCard = ({ name, description, matchTag, cta, isTopPick, url, productId }) => {
  let visual = null;
  if (productId === 'et_prime') {
    visual = (
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '42px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '28px', background: '#C0392B', opacity: 0.3 }}></div>
          <div style={{ width: '8px', height: '34px', background: '#C0392B', opacity: 0.3 }}></div>
          <div style={{ width: '8px', height: '42px', background: '#C0392B', opacity: 0.3 }}></div>
        </div>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#CCCCCC' }}>Price trend</div>
      </div>
    );
  } else if (productId === 'et_tax_wizard') {
    visual = (
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ marginBottom: '4px' }}>
          <circle cx="22" cy="22" r="20" stroke="#F0F0F0" strokeWidth="4" fill="none" />
          <circle cx="22" cy="22" r="20" stroke="#C0392B" strokeWidth="4" fill="none" strokeDasharray="75 125" strokeDashoffset="31" transform="rotate(-90 22 22)" />
          <text x="22" y="25" fontFamily="Arial, sans-serif" fontSize="9px" fontWeight="bold" fill="#111111" textAnchor="middle">60%</text>
        </svg>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#CCCCCC' }}>80C used</div>
      </div>
    );
  } else if (productId === 'et_term_insurance') {
    visual = (
      <div style={{ position: 'absolute', top: '16px', right: '16px', width: '70px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#CCCCCC', marginBottom: '2px' }}>Cover needed</div>
          <div style={{ height: '4px', width: '100%', background: '#F5F5F5', borderRadius: '2px', overflow: 'hidden' }}><div style={{ height: '100%', width: '90%', background: '#C0392B', opacity: 0.4 }}></div></div>
        </div>
        <div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#CCCCCC', marginBottom: '2px' }}>You have</div>
          <div style={{ height: '4px', width: '100%', border: '1px solid #E5E5E5', borderRadius: '2px', boxSizing: 'border-box' }}></div>
        </div>
        <div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#CCCCCC', marginBottom: '2px' }}>Gap</div>
          <div style={{ height: '4px', width: '100%', background: '#F5F5F5', borderRadius: '2px', overflow: 'hidden' }}><div style={{ height: '100%', width: '90%', background: '#C0392B', opacity: 0.2 }}></div></div>
        </div>
      </div>
    );
  } else if (productId === 'et_markets_sip') {
    visual = (
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <svg width="70" height="32" viewBox="0 0 70 32" style={{ marginBottom: '4px' }}>
          <polyline points="0,28 14,22 28,24 42,16 56,14 70,10" stroke="#C0392B" strokeWidth="1.5" fill="none" />
          <polyline points="0,28 14,24 28,20 42,18 56,15 70,12" stroke="#CCCCCC" strokeWidth="1" strokeDasharray="3 2" fill="none" />
        </svg>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#C0392B' }}></div><span style={{ fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#888' }}>Your SIPs</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#CCCCCC' }}></div><span style={{ fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#888' }}>Benchmark</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-card ${isTopPick ? 'priority' : ''}`}>
      {visual}
      <div className="card-header">
        <div className="card-title">{name}</div>
        {isTopPick && <div className="card-badge">TOP PICK</div>}
      </div>
      <div className="card-body">{description}</div>
      <div className="card-reason">→ {matchTag}</div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="card-cta">{cta}</a>
      ) : (
        <button className="card-cta">{cta}</button>
      )}
    </div>
  );
};

const GapItem = ({ title, explanation, severity }) => {
  const getCircleClass = (urgency) => {
    if (urgency === 'critical') return 'high';
    if (urgency === 'high') return 'medium';
    if (urgency === 'low') return 'low';
    return 'low';
  };
  return (
    <div className="gap-item">
      <div className={`gap-circle ${getCircleClass(severity)}`}></div>
      <div className="gap-text"><b>{title}</b> — {explanation}</div>
    </div>
  );
};

const GLOBAL_CSS = `
  /* Reset & Base */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: Arial, sans-serif; 
    background-color: #FFFFFF; 
    color: #444444; 
    -webkit-font-smoothing: antialiased;
  }
  
  /* Typography Classes */
  .font-georgia { font-family: Georgia, serif; }
  .font-arial { font-family: Arial, sans-serif; }
  
  /* Nav Bar */
  .navbar {
    height: 56px;
    border-bottom: 1px solid #E5E5E5;
    background: #FFFFFF;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 40px;
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
  }
  .nav-left { display: flex; align-items: center; gap: 12px; }
  .et-badge {
    background: #C0392B; color: #FFFFFF; font-weight: bold;
    padding: 4px 6px; font-size: 14px; letter-spacing: 1px;
  }
  .nav-title { font-size: 13px; font-weight: bold; letter-spacing: 2.5px; color: #111111; text-transform: uppercase; }
  .nav-right { display: flex; align-items: center; gap: 24px; }
  .nav-link {
    font-size: 13px; color: #666666; letter-spacing: 0.3px; cursor: pointer;
    height: 56px; display: flex; align-items: center;
    border-bottom: 2px solid transparent;
  }
  .nav-link.active { color: #C0392B; border-bottom: 2px solid #C0392B; }
  .restart-btn { font-size: 11px; color: #999999; cursor: pointer; border: none; background: none; }
  
  /* Layout */
  .main-container { padding-top: 56px; min-height: 100vh; padding-bottom: 36px; }
  .content-wrapper { max-width: 1280px; margin: 0 auto; position: relative; }
  
  /* Screen 1: Onboarding */
  .onboarding-wrap { display: grid; grid-template-columns: 1fr 400px; max-width: 1200px; margin: 0 auto; min-height: calc(100vh - 92px); }
  .ob-left { padding: 60px 48px 40px 60px; border-right: 1px solid #E5E5E5; display: flex; flex-direction: column; }
  .ob-right { padding: 48px 36px 40px 40px; background: #FAFAFA; }
  .ob-right-label { font-family: Arial, sans-serif; font-size: 10px; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }
  
  .ob-stat-card { background: #FFF; border: 1px solid #E5E5E5; padding: 16px 18px; margin-bottom: 10px; }
  .ob-stat-num { font-family: Georgia, serif; font-size: 30px; font-weight: bold; }
  .ob-stat-text { font-family: Arial, sans-serif; font-size: 12px; color: #888; line-height: 1.4; margin-top: 4px; }
  
  .ob-preview-card { background: #FFF; border: 1px solid #E5E5E5; padding: 18px; }
  .ob-preview-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F5F5F5; font-family: Arial, sans-serif; font-size: 13px; }
  .ob-preview-row:last-child { border-bottom: none; }
  .ob-preview-label { color: #999; }
  .ob-preview-ans { font-weight: bold; color: #111; animation: fadeIn 300ms ease-out forwards; display: flex; align-items: center; gap: 4px; }
  .ob-preview-placeholder { color: #CCC; }
  
  .fw-widget { border-top: 2px solid #000; padding-top: 14px; margin-top: 32px; background: transparent; }
  .fw-title { font-family: Arial, sans-serif; font-size: 20px; font-weight: 800; color: #000; margin-bottom: 8px; letter-spacing: -0.2px; }
  .fw-item { padding: 14px 0; border-bottom: 1px solid #EAEAEA; display: flex; justify-content: space-between; align-items: center; }
  .fw-item:last-child { border-bottom: 1px solid #EAEAEA; }
  .fw-left { display: flex; flex-direction: column; gap: 6px; }
  .fw-name { font-family: Arial, sans-serif; font-size: 15px; color: #111; font-weight: 400; }
  .fw-desc { font-family: Arial, sans-serif; font-size: 12px; color: #777; }
  .fw-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .fw-val { font-family: Arial, sans-serif; font-size: 15px; font-weight: 800; color: #000; }
  .fw-pill { font-family: Arial, sans-serif; font-size: 11.5px; padding: 3px 6px; font-weight: 400; letter-spacing: 0.2px; }
  .fw-footer { padding-top: 14px; text-align: right; }
  .fw-footer-text { font-family: Arial, sans-serif; font-size: 13px; font-weight: 800; color: #000; cursor: pointer; text-decoration: none; }

  @media (max-width: 900px) {
    .onboarding-wrap { grid-template-columns: 1fr; }
    .ob-left { padding: 32px 16px; border-right: none; }
    .ob-right { padding: 32px 16px; border-top: 1px solid #E5E5E5; background: #FFFFFF; }
  }

  .ob-label { font-size: 10px; color: #C0392B; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
  .ob-h1 { font-family: Georgia, serif; font-size: 32px; font-weight: bold; color: #111111; line-height: 1.2; margin-bottom: 16px; }
  .ob-sub { font-size: 15px; color: #666666; line-height: 1.6; margin-bottom: 32px; }
  
  .progress-wrap { margin-bottom: 32px; }
  .progress-bar-bg { background: transparent; height: 2px; width: 100%; margin-bottom: 8px; }
  .progress-bar-fill { background: #C0392B; height: 2px; transition: width 0.3s ease; }
  .progress-text { font-size: 11px; color: #999999; }
  
  .profile-panel { background: #F5F5F5; border: 1px solid #E5E5E5; padding: 16px; margin-bottom: 32px; }
  .panel-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 12px; }
  .chips-container { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip { padding: 6px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 2px; }
  .chip.empty { border: 1px dashed #CCCCCC; color: #999999; background: transparent; }
  .chip.filled { background: #111111; color: #FFFFFF; border: 1px solid #111111; animation: chipIn 0.2s ease-out forwards; }
  
  @keyframes chipIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  
  .chat-interface { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
  .msg-row { display: flex; width: 100%; animation: msgSlideIn 0.25s ease-out forwards; }
  .msg-row.et { justify-content: flex-start; }
  .msg-row.user { justify-content: flex-end; }
  
  .et-avatar { width: 32px; height: 32px; background: #111111; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
  .msg-bubble { font-size: 14px; padding: 14px 18px; max-width: 80%; line-height: 1.4; }
  .msg-bubble.et { background: #F5F5F5; color: #111111; border-radius: 0 8px 8px 8px; }
  .msg-bubble.user { background: #C0392B; color: #FFFFFF; border-radius: 8px 0 8px 8px; }
  
  .quick-replies { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; margin-left: 44px; }
  .reply-btn { border: 1px solid #cccccc; background: #F5F5F5; color: #444444; padding: 8px 16px; font-size: 13px; border-radius: 2px; cursor: pointer; transition: all 0.2s ease; }
  .reply-btn:hover:not(:disabled) { border-color: #C0392B; color: #C0392B; }
  .reply-btn:disabled { border-color: #cccccc; color: #999999; cursor: not-allowed; }
  
  @keyframes msgSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  
  .typing-indicator { display: flex; gap: 4px; padding: 6px 0; }
  .typing-dot { width: 6px; height: 6px; background: #999; border-radius: 50%; animation: typingPulse 1.4s infinite ease-in-out both; }
  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes typingPulse { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

  .why-matters { display: none; }
  
  /* Screen 2: Loading Redesign */
  .loading-wrap { max-width: 960px; margin: 0 auto; padding: 80px 40px; min-height: calc(100vh - 92px); display: grid; grid-template-columns: 380px 1fr; gap: 60px; align-items: center; }
  .load-left-label { font-family: Arial, sans-serif; font-size: 10px; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
  .load-left-card { background: #FFF; border: 1px solid #E5E5E5; padding: 24px; min-height: 200px; display: flex; flex-direction: column; align-items: flex-start; }
  .load-chip { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; padding: 5px 12px; border-radius: 2px; display: inline-block; margin: 4px; animation: fadeInUp 300ms ease-out forwards; opacity: 0; }
  .load-text-line { font-family: Arial, sans-serif; font-size: 14px; color: #27AE60; font-weight: 500; margin-top: 12px; animation: fadeIn 400ms ease-out forwards; opacity: 0; }
  .load-circ { position: relative; width: 72px; height: 72px; margin: 0 auto 32px auto; }
  .load-svg { width: 100%; height: 100%; animation: spin 1.4s linear infinite; transform-origin: center center; }
  .load-bg { stroke: #F0F0F0; stroke-width: 4; fill: none; }
  .load-arc { stroke: #C0392B; stroke-width: 4; fill: none; stroke-dasharray: 91 91; }
  .load-dot { position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: #C0392B; border-radius: 50%; margin-top: -4px; margin-left: -4px; animation: pulse 1.4s ease-in-out infinite alternate; }
  .load-title { font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #111; text-align: center; margin-bottom: 12px; }
  .load-subtext-wrap { height: 16px; margin-bottom: 36px; position: relative; width: 100%; display: flex; justify-content: center; }
  .load-subtext { font-family: Arial, sans-serif; font-size: 14px; color: #888; font-style: italic; text-align: center; position: absolute; transition: opacity 250ms ease; opacity: 0; }
  .load-subtext.active { opacity: 1; }
  .load-bar-wrap { width: 100%; height: 2px; background: #F0F0F0; border-radius: 2px; margin-bottom: 12px; overflow: hidden; }
  .load-bar-fill { height: 100%; background: #C0392B; width: 0%; animation: fillBar 5000ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  .load-dots { display: flex; gap: 10px; justify-content: center; margin-bottom: 4px; }
  
  @media (max-width: 768px) {
    .loading-wrap { grid-template-columns: 1fr; padding: 40px 20px; }
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse { from { transform: scale(0.8); opacity: 0.6; } to { transform: scale(1.2); opacity: 1; } }
  @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  
  /* Screen 3: Dashboard */
  .dashboard-wrap { display: flex; min-height: calc(100vh - 56px); animation: fadeIn 0.3s ease-in; }
  .dash-main { flex: 1; padding: 40px; border-right: 1px solid #E5E5E5; }
  .dash-sidebar { width: 300px; padding: 32px 24px; background: #FAFAFA; flex-shrink: 0; }
  
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  
  .profile-strip {
    background: #F5F5F5; border-left: 3px solid #C0392B; padding: 14px 16px; margin-bottom: 40px;
  }
  .strip-label { font-size: 10px; color: #C0392B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .strip-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .strip-chip {
    background: #FFFFFF; border: 1px solid #DDDDDD; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 4px 8px; color: #444; border-radius: 2px;
  }
  
  .dash-h1 { font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #111111; margin-bottom: 6px; }
  .dash-sub { font-size: 12px; color: #AAAAAA; letter-spacing: 0.3px; margin-bottom: 40px; }
  
  .section-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 16px; }
  
  .cards-stack { display: flex; flex-direction: column; gap: 12px; margin-bottom: 48px; }
  .product-card {
    border: 1px solid #E5E5E5; padding: 18px 20px; background: #FFFFFF; border-radius: 0; position: relative;
  }
  .product-card.priority { border-left: 3px solid #C0392B; }
  .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .card-title { font-size: 15px; font-weight: bold; color: #111111; }
  .card-badge { background: #C0392B; color: #FFFFFF; font-size: 10px; padding: 2px 8px; text-transform: uppercase; font-weight: bold; border-radius: 2px; }
  .card-body { font-size: 14px; color: #444; line-height: 1.5; margin-bottom: 16px; }
  .card-reason { font-size: 11px; color: #C0392B; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }
  .card-cta {
    border: 1px solid #111111; background: #FFFFFF; color: #111111;
    font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; padding: 7px 16px;
    cursor: pointer; transition: background 0.15s, color 0.15s; width: fit-content; margin-left: auto; display: block;
    border-radius: 0; text-decoration: none;
  }
  .card-cta:hover { background: #111111; color: #FFFFFF; }
  
  .gaps-list { display: flex; flex-direction: column; gap: 12px; }
  .gap-item { display: flex; gap: 12px; align-items: flex-start; }
  .gap-circle { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; margin-top: 4px; }
  .gap-circle.high { background: #C0392B; }
  .gap-circle.medium { background: #E67E22; }
  .gap-circle.low { background: #27AE60; }
  .gap-text { font-size: 13px; color: #444; line-height: 1.5; }
  
  .side-block { background: #FFFFFF; border: 1px solid #E5E5E5; padding: 16px; margin-bottom: 24px; border-radius: 0; }
  .side-block.priority { border-left: 3px solid #C0392B; }
  .side-title { font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: #111; margin-bottom: 8px; }
  .side-desc { font-size: 12px; color: #888; line-height: 1.5; }
  
  .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .score-card { background: #FFFFFF; border: 1px solid #E5E5E5; padding: 12px; text-align: center; border-radius: 0; }
  .score-num { font-family: Georgia, serif; font-size: 18px; font-weight: bold; margin-bottom: 4px; }
  .score-num.red { color: #C0392B; }
  .score-num.orange { color: #E67E22; }
  .score-num.green { color: #27AE60; }
  .score-label { font-size: 11px; color: #999; }
  
  .alert-title { font-size: 12px; font-weight: bold; color: #111; margin-bottom: 8px; }
  .alert-body { font-size: 12px; color: #666; line-height: 1.5; }
  
  /* Ticker */
  .bottom-ticker {
    position: fixed; bottom: 0; left: 0; right: 0; height: 36px;
    background: #111; display: flex; align-items: center; z-index: 1000; overflow: hidden;
  }
  .ticker-label {
    background: #111; color: #C0392B; font-family: Arial, sans-serif; font-size: 10px; font-weight: bold;
    letter-spacing: 1.5px; padding: 0 16px; height: 36px; display: flex; align-items: center;
    border-right: 1px solid #333; flex-shrink: 0; z-index: 2;
  }
  .ticker-scroll { display: flex; align-items: center; white-space: nowrap; animation: marquee 28s linear infinite; }
  .ticker-content { display: flex; align-items: center; gap: 24px; padding-left: 24px; }
  .ticker-item { font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.5px; color: #888; }
  .ticker-val { color: #fff; font-weight: 700; margin-left: 6px; }
  .ticker-up { color: #27AE60; margin-left: 4px; }
  .ticker-down { color: #C0392B; margin-left: 4px; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

  /* Sidebar Tasks & Chat */
  .task-item { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; cursor: pointer; }
  .task-box { width: 14px; height: 14px; border: 1px solid #CCC; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; flex-shrink: 0; }
  .task-box.checked { background: #27AE60; border-color: #27AE60; }
  .task-box.checked::after { content: ''; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); margin-bottom: 2px; }
  .task-text { font-family: Arial, sans-serif; font-size: 13px; color: #444; transition: all 0.15s ease; }
  .task-text.checked { text-decoration: line-through; color: #AAA; }
  
  .chat-input-wrap { display: flex; border: 1px solid #DDD; height: 36px; transition: border-color 0.2s ease; margin-top: 12px; }
  .chat-input-wrap:focus-within { border-color: #C0392B; }
  .chat-inline-input { flex: 1; border: none; padding: 0 12px; font-family: Arial, sans-serif; font-size: 13px; outline: none; width: 100%; min-width: 0; background: transparent; }
  .chat-inline-btn { width: 36px; background: transparent; border: none; color: #444; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: color 0.2s ease; flex-shrink: 0; }
  .chat-inline-btn:hover { color: #C0392B; }
  .chat-response { background: #EAEAEA; font-size: 12px; color: #444; padding: 12px; border-radius: 4px; margin-top: 12px; animation: chipIn 0.3s ease-out; line-height: 1.4; border-left: 3px solid #C0392B; }

  .ticker-row { display: flex; justify-content: space-between; align-items: center; height: 36px; border-bottom: 1px solid #F5F5F5; text-decoration: none; color: inherit; cursor: pointer; transition: background 0.15s; }
  .ticker-row:hover { background: #F5F5F5; }
  .ticker-row:last-child { border-bottom: none; }
  
  .et-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; }
  .et-modal-box { background: #FFFFFF; max-width: 600px; width: 90%; border-radius: 4px; padding: 32px 36px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .et-modal-close { position: absolute; top: 16px; right: 20px; font-family: Arial, sans-serif; font-size: 20px; color: #999; cursor: pointer; border: none; background: none; padding: 0; outline: none; }
  .et-modal-title { font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #111; margin: 0 0 6px 0; }
  .et-modal-subtitle { font-family: Arial, sans-serif; font-size: 13px; color: #888; margin: 0 0 24px 0; }
  .et-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .et-modal-card { background: #FFFFFF; border: 1px solid #E5E5E5; padding: 14px 16px; cursor: pointer; transition: border-color 0.15s; text-decoration: none; display: block; border-radius: 2px; }
  .et-modal-card:hover { border-color: #C0392B; }
  .et-modal-card-title { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #111; }
  .et-modal-card-desc { font-family: Arial, sans-serif; font-size: 11px; color: #888; margin-top: 3px; }

  @media (max-width: 768px) {
    .navbar { padding: 0 16px; }
    .nav-link { display: none; }
    .nav-right { gap: 12px; }
    .dashboard-wrap { flex-direction: column; }
    .dash-main { border-right: none; padding: 24px 16px; }
    .dash-sidebar { width: 100%; padding: 24px 16px; border-top: 1px solid #E5E5E5; }
    .quick-replies { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-left: 0; }
    .et-avatar { margin-bottom: 8px; }
    .msg-row.et { flex-direction: column; align-items: flex-start; }
    .msg-bubble { max-width: 85%; }
  }
`;

const QUESTIONS = [
  {
    key: 'goal',
    text: "Welcome! I'm your ET concierge. To personalise your experience, let me ask a few quick questions. What's your main financial goal right now?",
    options: ["Buy a home", "Grow my investments", "Plan for retirement", "Just started earning"]
  },
  {
    key: 'investment',
    text: "Great. Are you already investing or just getting started?",
    options: ["Have SIPs running", "Some FDs and savings", "Just starting out", "Have a portfolio"]
  },
  {
    key: 'age',
    text: "And roughly what's your age bracket?",
    options: ["Under 25", "25–35", "35–45", "45+"]
  },
  {
    key: 'insurance',
    text: "Last one — do you have term insurance?",
    options: ["Yes, covered", "No, not yet", "Not sure what that is"]
  },
  {
    key: 'career_focus',
    text: "One last thing — are you more focused on your career growth or your financial growth right now?",
    options: ["Financial growth", "Career growth", "Both equally"]
  }
];

const CLOSING_MSG = "Perfect — I have everything I need. Let me build your personalised ET dashboard now.";

const LOADING_PHRASES = [
  "Understanding your goals",
  "Evaluating your risk profile",
  "Mapping ET opportunities for you",
  "Checking ET ecosystem fit",
  "Building your dashboard"
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding'); // onboarding, loading, dashboard
  const [answers, setAnswers] = useState({});
  const [chatFlow, setChatFlow] = useState([
    { sender: 'ET', text: QUESTIONS[0].text, options: QUESTIONS[0].options, questionIndex: 0 }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState(null);

  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [fadePhrase, setFadePhrase] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [tasks, setTasks] = useState([false, false, false]);
  const [chatInput, setChatInput] = useState('');
  const [chatSubmitted, setChatSubmitted] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    // Inject custom styles
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    createSession()
      .then(data => setSessionId(data.session_id))
      .catch(() => setSessionId(crypto.randomUUID()));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowServicesModal(false);
    };
    if (showServicesModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showServicesModal]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatFlow, isTyping]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRestart = () => {
    setCurrentScreen('onboarding');
    setAnswers({});
    setChatFlow([
      { sender: 'ET', text: QUESTIONS[0].text, options: QUESTIONS[0].options, questionIndex: 0 }
    ]);
    setIsTyping(false);
    setLoadingPhraseIndex(0);
    setLoadStep(0);
    setTasks([false, false, false]);
    setChatInput('');
    setChatSubmitted(false);
    setApiData(null);
    setApiError(null);
    setSessionId(null);
    createSession()
      .then(data => setSessionId(data.session_id))
      .catch(() => setSessionId(crypto.randomUUID()));
  };

  const answerQuestion = (option, qIndex) => {
    // Mark current question options as answered
    setChatFlow(prev => {
      const newFlow = [...prev];
      newFlow[newFlow.length - 1] = { ...newFlow[newFlow.length - 1], answered: true };
      newFlow.push({ sender: 'User', text: option });
      return newFlow;
    });

    const q = QUESTIONS[qIndex];
    setAnswers(prev => ({ ...prev, [q.key]: option }));

    const nextQIndex = qIndex + 1;
    const isLast = nextQIndex >= QUESTIONS.length;

    if (isLast) {
      setApiLoading(true);
      const updatedAnswers = { ...answers, [q.key]: option };
      // Don't block UI transition on session creation/API latency.
      // Ensure we still send a session id.
      const activeSessionId = sessionId || crypto.randomUUID();
      if (!sessionId) setSessionId(activeSessionId);

      buildProfile(activeSessionId, {
        goal: updatedAnswers.goal,
        investment_status: updatedAnswers.investment,
        age_bracket: updatedAnswers.age,
        insurance_status: updatedAnswers.insurance,
        career_focus: updatedAnswers.career_focus
      }).then(data => setApiData(data))
        .catch(err => {
          console.error(err);
          setApiError(err);
        })
        .finally(() => setApiLoading(false));
    }

    // User click -> User text -> wait totalDelay -> ET text
    // The typing indicator shows up 500ms before ET text
    const totalDelay = isLast ? 1000 : 800;
    const typingDelay = totalDelay - 500;

    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (!isLast) {
          const nextQ = QUESTIONS[nextQIndex];
          setChatFlow(prev => [...prev, {
            sender: 'ET', text: nextQ.text, options: nextQ.options, questionIndex: nextQIndex
          }]);
        } else {
          setChatFlow(prev => [...prev, { sender: 'ET', text: CLOSING_MSG }]);
          setTimeout(() => {
            setCurrentScreen('loading');
          }, 1200);
        }
      }, 500);
    }, typingDelay > 0 ? typingDelay : 0);
  };

  // Loading Screen Logic
  useEffect(() => {
    if (currentScreen === 'loading') {
      setLoadingPhraseIndex(0);
      setFadePhrase(true);
      setLoadStep(0);

      const interval = setInterval(() => {
        setFadePhrase(false);
        setTimeout(() => {
          setLoadingPhraseIndex(prev => {
            const next = prev + 1;
            return next < 5 ? next : 4;
          });
          setFadePhrase(true);
        }, 250); // wait for fade out to complete
      }, 1800);

      const t1 = setTimeout(() => setLoadStep(1), 1200);
      const t2 = setTimeout(() => setLoadStep(2), 2800);
      const t3 = setTimeout(() => setLoadStep(3), 4200);

      const tDashboard = setTimeout(() => {
        setCurrentScreen('dashboard');
      }, 5200);

      return () => {
        clearInterval(interval);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(tDashboard);
      };
    }
  }, [currentScreen]);

  const profileData = apiData?.profile || FALLBACK_PROFILE;
  const recommendationsData = apiData?.recommendations || FALLBACK_RECOMMENDATIONS;
  const gapsData = apiData?.gaps || FALLBACK_GAPS;
  const archetypeData = apiData?.archetype || FALLBACK_ARCHETYPE;
  const scoresData = archetypeData.health_scores || FALLBACK_ARCHETYPE.health_scores;

  const [chatMessages, setChatMessages] = useState([]);

  const handleChatSubmit = async (message) => {
    if (!message.trim()) return;

    setChatSubmitted(true);
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setIsTyping(true);

    try {
      const data = await sendChatMessage(sessionId, message);
      setChatMessages(prev => [...prev, { role: 'et', text: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'et', text: "Based on your profile, I'd recommend starting with your highest-priority gap first. Would you like me to guide you?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="main-container">
      {/* NavBar */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="et-badge">ET</div>
          <div className="nav-title">AI CONCIERGE</div>
        </div>
        <div className="nav-right">
          <div className={`nav-link ${currentScreen === 'onboarding' ? 'active' : ''}`} onClick={() => setCurrentScreen('onboarding')}>Concierge</div>
          <div className="nav-link" onClick={() => showToast("Coming soon")}>My profile</div>
          <div className="nav-link" onClick={() => setShowServicesModal(true)}>ET services</div>
          <div className="nav-link" onClick={() => showToast("Coming soon")}>Settings</div>
          <button className="restart-btn" onClick={handleRestart}>Restart demo</button>
        </div>
      </nav>

      <div className="content-wrapper">
        {/* Screen 1: Onboarding Chat */}
        {currentScreen === 'onboarding' && (
          <div className="onboarding-wrap">
            <div className="ob-left">
              <div className="ob-label">ET AI CONCIERGE · PERSONALISED ONBOARDING</div>
              <h1 className="ob-h1">Your personal guide to everything ET offers</h1>
              <p className="ob-sub">Answer 5 quick questions. We'll map your financial life to the right ET tools, articles, and services — instantly.</p>

              <div className="progress-wrap">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${(Object.keys(answers).length / 5) * 100}%` }}></div>
                </div>
                <div className="progress-text">Step {Math.min(Object.keys(answers).length + 1, 5)} of 5 · Building your profile</div>
              </div>

              <div className="profile-panel">
                <div className="panel-label">PROFILE BUILDING</div>
                <div className="chips-container">
                  <div className={`chip ${answers.goal ? 'filled' : 'empty'}`}>{answers.goal ? `Goal: ${answers.goal}` : "Goal"}</div>
                  <div className={`chip ${answers.investment ? 'filled' : 'empty'}`}>{answers.investment ? `Inv: ${answers.investment}` : "Investment status"}</div>
                  <div className={`chip ${answers.age ? 'filled' : 'empty'}`}>{answers.age ? `Age: ${answers.age}` : "Age"}</div>
                  <div className={`chip ${answers.insurance ? 'filled' : 'empty'}`}>{answers.insurance ? `Ins: ${answers.insurance}` : "Insurance"}</div>
                  <div className={`chip ${answers.career_focus ? 'filled' : 'empty'}`}>{answers.career_focus ? `Focus: ${answers.career_focus}` : "Focus"}</div>
                </div>
              </div>

              <div className="chat-interface">
                {chatFlow.map((msg, i) => (
                  <div key={i} className={`msg-row ${msg.sender.toLowerCase()}`}>
                    {msg.sender === 'ET' && <div className="et-avatar">ET</div>}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className={`msg-bubble ${msg.sender.toLowerCase()}`}>
                        {msg.text}
                      </div>
                      {msg.options && (
                        <div className="quick-replies">
                          {msg.options.map((opt, j) => (
                            <button
                              key={j}
                              className="reply-btn"
                              disabled={msg.answered}
                              onClick={() => answerQuestion(opt, msg.questionIndex)}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="msg-row et">
                    <div className="et-avatar">ET</div>
                    <div className="msg-bubble et">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="ob-right">
              {/* Right Block A — "THE PROBLEM WE SOLVE" */}
              <div className="ob-right-label">THE PROBLEM WE SOLVE</div>
              <div className="ob-stat-card">
                <div className="ob-stat-num" style={{ color: '#C0392B' }}>10%</div>
                <div className="ob-stat-text">of ET's ecosystem discovered by the average user</div>
              </div>
              <div className="ob-stat-card">
                <div className="ob-stat-num">14 Cr+</div>
                <div className="ob-stat-text">Indians with demat accounts have no personalised financial guide</div>
              </div>
              <div className="ob-stat-card">
                <div className="ob-stat-num">3 min</div>
                <div className="ob-stat-text">is all ET AI Concierge needs to map your complete financial life</div>
              </div>

              {/* Right Block B — "YOUR PROFILE PREVIEW" */}
              <div className="ob-right-label" style={{ marginTop: '28px' }}>YOUR PROFILE PREVIEW</div>
              <div className="ob-preview-card">
                {[
                  { label: "Goal", key: "goal" },
                  { label: "Investments", key: "investment" },
                  { label: "Age", key: "age" },
                  { label: "Insurance", key: "insurance" },
                  { label: "Focus", key: "career_focus" }
                ].map(item => (
                  <div key={item.key} className="ob-preview-row">
                    <div className="ob-preview-label">{item.label}</div>
                    {answers[item.key] ? (
                      <div className="ob-preview-ans">
                        <span>{answers[item.key]}</span>
                        <span style={{ color: '#27AE60', fontSize: '11px' }}>✓</span>
                      </div>
                    ) : (
                      <div className="ob-preview-placeholder">—</div>
                    )}
                  </div>
                ))}

                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'italic', color: '#AAAAAA', textAlign: 'center', marginTop: '10px' }}>
                  {Object.keys(answers).length === 0 && "Waiting for your answers..."}
                  {Object.keys(answers).length > 0 && Object.keys(answers).length < 5 && "Building your profile..."}
                  {Object.keys(answers).length === 5 && "Profile complete — generating dashboard..."}
                </div>
              </div>

              {/* Right Block C — "WHAT YOU'LL UNLOCK" Redesign matching reference screenshot */}
              <div className="fw-widget">
                <div className="fw-title">What You'll Unlock</div>
                
                {[
                  { title: "ET Prime Access", desc: "03:59 PM | 27 Mar 2026", val: "Explore", pill: "Member Only", color: "#D32F2F", bg: "#FDE8E8" },
                  { title: "ET Money Genius", desc: "03:59 PM | 27 Mar 2026", val: "Start SIP", pill: "AI Driven", color: "#D32F2F", bg: "#FDE8E8" },
                  { title: "ET Markets Pro", desc: "03:59 PM | 27 Mar 2026", val: "Track Now", pill: "Live Data", color: "#D32F2F", bg: "#FDE8E8" },
                  { title: "ET Wealth Tools", desc: "03:59 PM | 27 Mar 2026", val: "Plan Now", pill: "Essential", color: "#D32F2F", bg: "#FDE8E8" }
                ].map((item, i) => (
                  <div key={i} className="fw-item">
                    <div className="fw-left">
                      <div className="fw-name">{item.title}</div>
                      <div className="fw-desc">{item.desc}</div>
                    </div>
                    <div className="fw-right">
                      <div className="fw-val">{item.val}</div>
                      <div className="fw-pill" style={{ color: item.color, backgroundColor: item.bg }}>{item.pill}</div>
                    </div>
                  </div>
                ))}
                
                <div className="fw-footer">
                  <span className="fw-footer-text">Load more...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screen 2: Loading / Processing */}
        {currentScreen === 'loading' && (
          <div className="loading-wrap">
            <div className="load-left-col">
              <div className="load-left-label">YOUR PROFILE BEING BUILT</div>
              <div className="load-left-card">
                <div>
                  {loadStep >= 0 && (
                    <div className="load-chip" style={{ background: '#111', color: '#FFF' }}>Goal-saver archetype</div>
                  )}
                  {loadStep >= 1 && (
                    <div className="load-chip" style={{ background: '#C0392B', color: '#FFF' }}>3 gaps identified</div>
                  )}
                  {loadStep >= 2 && (
                    <>
                      <div className="load-chip" style={{ background: '#F5F5F5', color: '#444', animationDelay: '0ms' }}>ET Prime</div>
                      <div className="load-chip" style={{ background: '#F5F5F5', color: '#444', animationDelay: '200ms' }}>ET Money Genius</div>
                      <div className="load-chip" style={{ background: '#F5F5F5', color: '#444', animationDelay: '400ms' }}>Tax Wizard</div>
                    </>
                  )}
                  {loadStep >= 3 && (
                    <div className="load-text-line">Dashboard ready</div>
                  )}
                </div>
              </div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontStyle: 'italic', color: '#AAAAAA', marginTop: '12px' }}>
                Based on 5 questions — no form filling required.
              </div>
            </div>

            <div className="load-right-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="load-circ">
                <svg className="load-svg" viewBox="0 0 72 72">
                  <circle className="load-bg" cx="36" cy="36" r="29" />
                  <circle className="load-arc" cx="36" cy="36" r="29" />
                </svg>
                <div className="load-dot"></div>
              </div>

              <div className="load-title">Analysing your financial profile...</div>

              <div className="load-subtext-wrap">
                {LOADING_PHRASES.map((txt, i) => (
                  <div key={i} className={`load-subtext ${i === loadingPhraseIndex && fadePhrase ? 'active' : ''}`}>
                    {txt}
                  </div>
                ))}
              </div>

              <div className="load-bar-wrap">
                <div className="load-bar-fill"></div>
              </div>

              <div className="load-steps-wrap" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="load-dots">
                  {[0, 1, 2].map(step => {
                    let dotClass = 'pending';
                    if (step < Math.min(loadStep, 2)) dotClass = 'completed';
                    if (step === Math.min(loadStep, 2)) dotClass = 'active';
                    return <div key={step} className={`loading-dot ${dotClass}`} style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotClass === 'active' ? '#C0392B' : (dotClass === 'completed' ? '#111' : '#DDD'), transform: dotClass === 'active' ? 'scale(1.4)' : 'scale(1)', transition: 'all 200ms ease' }}></div>;
                  })}
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#AAAAAA', marginTop: '8px', textAlign: 'center' }}>
                  Step {Math.min(loadStep + 1, 3)} of 3
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screen 3: Dashboard */}
        {currentScreen === 'dashboard' && (
          <div className="dashboard-wrap">
            <div className="dash-main">
              <div className="profile-strip">
                <div className="strip-label">YOUR PROFILE · {profileData.archetype_name ? profileData.archetype_name.toUpperCase() : "GOAL-SAVER ARCHETYPE"}</div>
                <div className="strip-chips">
                  {[profileData.age_bracket, profileData.goal, profileData.investment_status || profileData.investment || "SIP ₹8k/mo", profileData.insurance_status, profileData.risk_profile || "Moderate risk"].filter(Boolean).map((txt, i) => (
                    <div key={i} className="strip-chip">{txt}</div>
                  ))}
                </div>
              </div>

              <h2 className="dash-h1">Your ET starting point, Rahul</h2>
              <p className="dash-sub">Based on your profile · Generated by ET AI Concierge · Updated now</p>

              <div className="section-label">RECOMMENDED ET SERVICES · PRIORITY ORDER</div>

              <div className="cards-stack">
                {recommendationsData.map(rec => (
                  <ProductCard
                    key={rec.product_id}
                    productId={rec.product_id}
                    name={rec.product_name}
                    description={rec.reason}
                    matchTag={rec.match_tag}
                    cta={rec.cta_text}
                    isTopPick={rec.is_top_pick}
                    url={PRODUCT_URLS[rec.product_id]}
                  />
                ))}
              </div>

              <div className="section-label">FINANCIAL GAPS · IDENTIFIED BY AI</div>
              <div className="gaps-list">
                {gapsData.map((gap, i) => (
                  <GapItem
                    key={i}
                    title={gap.title}
                    explanation={gap.explanation}
                    severity={gap.urgency}
                  />
                ))}
              </div>
            </div>

            <div className="dash-sidebar">
              <div className="side-block">
                <div className="side-title">{archetypeData.name}</div>
                <div className="side-desc">{archetypeData.description}</div>
              </div>

              <div className="side-block">
                <div className="section-label">FINANCIAL HEALTH SCORE</div>
                <div className="score-grid">
                  <div className="score-card">
                    <div className={`score-num ${scoresData.insurance <= 2 ? 'red' : scoresData.insurance === 3 ? 'orange' : 'green'}`}>{scoresData.insurance}/5</div>
                    <div className="score-label">Insurance</div>
                  </div>
                  <div className="score-card">
                    <div className={`score-num ${scoresData.tax_efficiency <= 2 ? 'red' : scoresData.tax_efficiency === 3 ? 'orange' : 'green'}`}>{scoresData.tax_efficiency}/5</div>
                    <div className="score-label">Tax efficiency</div>
                  </div>
                  <div className="score-card">
                    <div className={`score-num ${scoresData.investments <= 2 ? 'red' : scoresData.investments === 3 ? 'orange' : 'green'}`}>{scoresData.investments}/5</div>
                    <div className="score-label">Investments</div>
                  </div>
                  <div className="score-card">
                    <div className={`score-num ${scoresData.savings_habit <= 2 ? 'red' : scoresData.savings_habit === 3 ? 'orange' : 'green'}`}>{scoresData.savings_habit}/5</div>
                    <div className="score-label">Savings habit</div>
                  </div>
                </div>
              </div>

              <div className="side-block priority">
                <div className="section-label" style={{ marginBottom: '8px' }}>ET INTELLIGENCE ALERT</div>
                <div className="alert-title">Home loan rates may rise Q2 2025</div>
                <div className="alert-body">RBI policy signals suggest a potential rate adjustment. Locking in pre-approval now could save ₹3–5 lakh over the loan tenure.</div>
              </div>

              <div className="side-block">
                <div className="section-label" style={{ marginBottom: '16px' }}>YOUR 3-STEP ACTION PLAN</div>
                {[
                  "Get term insurance quote — before EMIs start",
                  "Run Tax Wizard — find your ₹18k savings",
                  "Check home loan eligibility now"
                ].map((txt, i) => (
                  <div key={i} className="task-item" onClick={() => {
                    const newTasks = [...tasks];
                    newTasks[i] = !newTasks[i];
                    setTasks(newTasks);
                  }}>
                    <div className={`task-box ${tasks[i] ? 'checked' : ''}`}></div>
                    <div className={`task-text ${tasks[i] ? 'checked' : ''}`}>{txt}</div>
                  </div>
                ))}
              </div>

              <div className="side-block">
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#999999', marginBottom: '12px' }}>ET MARKET PULSE</div>

                {/* Row 1 */}
                <a href="https://economictimes.indiatimes.com/hdfc-bank-ltd/stocks/companyid-9195.cms" target="_blank" rel="noopener noreferrer" className="ticker-row">
                  <div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#111111' }}>HDFC Bank</div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#999999' }}>NSE</div>
                  </div>
                  <svg width="60" height="24" viewBox="0 0 60 24">
                    <polyline points="20,18 25,15 35,16 40,12 50,10 60,8" stroke="#27AE60" strokeWidth="1.5" fill="none" />
                  </svg>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', color: '#111111' }}>₹1,642.30</div>
                      <div style={{ background: '#EAF5EC', color: '#27AE60', fontSize: '10px', padding: '2px 6px', borderRadius: '2px' }}>▲ 1.24%</div>
                    </div>
                  </div>
                </a>

                {/* Row 2 */}
                <a href="https://economictimes.indiatimes.com/state-bank-of-india/stocks/companyid-11984.cms" target="_blank" rel="noopener noreferrer" className="ticker-row">
                  <div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#111111' }}>SBI</div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#999999' }}>NSE</div>
                  </div>
                  <svg width="60" height="24" viewBox="0 0 60 24">
                    <polyline points="20,20 25,17 35,14 45,12 55,9 60,7" stroke="#27AE60" strokeWidth="1.5" fill="none" />
                  </svg>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', color: '#111111' }}>₹812.45</div>
                      <div style={{ background: '#EAF5EC', color: '#27AE60', fontSize: '10px', padding: '2px 6px', borderRadius: '2px' }}>▲ 0.87%</div>
                    </div>
                  </div>
                </a>

                {/* Row 3 */}
                <a href="https://economictimes.indiatimes.com/lic-housing-finance-ltd/stocks/companyid-13063.cms" target="_blank" rel="noopener noreferrer" className="ticker-row">
                  <div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#111111' }}>LIC Housing</div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#999999' }}>NSE</div>
                  </div>
                  <svg width="60" height="24" viewBox="0 0 60 24">
                    <polyline points="20,8 25,10 35,9 45,13 55,14 60,16" stroke="#C0392B" strokeWidth="1.5" fill="none" />
                  </svg>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', color: '#111111' }}>₹634.10</div>
                      <div style={{ background: '#FDEDED', color: '#C0392B', fontSize: '10px', padding: '2px 6px', borderRadius: '2px' }}>▼ 0.43%</div>
                    </div>
                  </div>
                </a>

                {/* Row 4 */}
                <a href="https://economictimes.indiatimes.com/indices/nifty_50_companies" target="_blank" rel="noopener noreferrer" className="ticker-row" style={{ borderBottom: 'none' }}>
                  <div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#111111' }}>Nifty 50</div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#999999' }}>INDEX</div>
                  </div>
                  <svg width="60" height="24" viewBox="0 0 60 24">
                    <polyline points="20,16 28,14 36,15 44,11 52,9 60,8" stroke="#27AE60" strokeWidth="1.5" fill="none" />
                  </svg>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', color: '#111111' }}>22,456.80</div>
                      <div style={{ background: '#EAF5EC', color: '#27AE60', fontSize: '10px', padding: '2px 6px', borderRadius: '2px' }}>▲ 0.34%</div>
                    </div>
                  </div>
                </a>

                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'italic', color: '#AAAAAA', textAlign: 'right', marginTop: '8px' }}>Relevant to your home purchase goal</div>

                <div style={{ height: '1px', background: '#F0F0F0', margin: '16px 0' }}></div>

                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', letterSpacing: '2px', color: '#999999', marginBottom: '8px' }}>ET TODAY</div>
                <div style={{ padding: '10px 0' }}>
                  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', fontWeight: 'bold', background: '#F5F5F5', color: '#888', padding: '2px 6px', marginBottom: '6px', display: 'inline-block', borderRadius: '2px' }}>REAL ESTATE</div>
                  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#111111', fontWeight: 500, lineHeight: 1.4, margin: '4px 0' }}>RBI holds rates — home loan EMIs steady for Q2 2025</div>
                  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#AAAAAA' }}>ET Bureau · 2 hours ago</div>
                  <a href="https://economictimes.indiatimes.com/prime" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#C0392B', cursor: 'pointer', marginTop: '4px', display: 'block' }}>Read on ET Prime →</a>
                </div>
              </div>

              <div className="side-block">
                <div className="section-label" style={{ marginBottom: '8px' }}>ASK ET ANYTHING</div>
                <div className="chat-input-wrap">
                  <input
                    type="text"
                    className="chat-inline-input"
                    placeholder="Ask about your finances..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && chatInput) handleChatSubmit(chatInput); }}
                  />
                  <button className="chat-inline-btn" onClick={() => { if (chatInput) handleChatSubmit(chatInput); }}>→</button>
                </div>
                {chatMessages.length > 0 && chatMessages.map((msg, idx) => (
                  <div key={idx} className="chat-response" style={{ borderLeftColor: msg.role === 'et' ? '#C0392B' : '#AAAAAA', background: msg.role === 'et' ? '#EAEAEA' : '#FFFFFF' }}>
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        {showServicesModal && (
          <div className="et-modal-overlay" onClick={() => setShowServicesModal(false)}>
            <div className="et-modal-box" onClick={(e) => e.stopPropagation()}>
              <button className="et-modal-close" onClick={() => setShowServicesModal(false)}>×</button>
              <h2 className="et-modal-title">ET Ecosystem</h2>
              <p className="et-modal-subtitle">Everything ET offers — click to explore</p>

              <div className="et-modal-grid">
                <a href="https://economictimes.indiatimes.com/prime" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ET Prime</div>
                  <div className="et-modal-card-desc">Deep research & analysis</div>
                </a>
                <a href="https://economictimes.indiatimes.com/markets" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ET Markets</div>
                  <div className="et-modal-card-desc">Live stocks & tools</div>
                </a>
                <a href="https://www.etmoney.com/" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ET Money</div>
                  <div className="et-modal-card-desc">Invest & manage wealth</div>
                </a>
                <a href="https://economictimes.indiatimes.com/wealth" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ET Wealth</div>
                  <div className="et-modal-card-desc">Personal finance tools</div>
                </a>
                <a href="https://et-edge.com/" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ET Edge</div>
                  <div className="et-modal-card-desc">Summits & masterclasses</div>
                </a>
                <a href="https://hr.economictimes.indiatimes.com/" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ETHRWorld</div>
                  <div className="et-modal-card-desc">HR community</div>
                </a>
                <a href="https://cio.economictimes.indiatimes.com/" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ETCIO</div>
                  <div className="et-modal-card-desc">Tech leadership</div>
                </a>
                <a href="https://brandequity.economictimes.indiatimes.com/" target="_blank" rel="noopener noreferrer" className="et-modal-card">
                  <div className="et-modal-card-title">ETBrandEquity</div>
                  <div className="et-modal-card-desc">Marketing & media</div>
                </a>
              </div>
            </div>
          </div>
        )}
      </div> {/* End content-wrapper */}

      {/* Bottom Ticker */}
      <div className="bottom-ticker">
        <div className="ticker-label">ET MARKETS</div>
        <div className="ticker-scroll">
          <div className="ticker-content">
            <div className="ticker-item">NIFTY 50<span className="ticker-val">22,456.80</span><span className="ticker-up">▲ 0.34%</span></div>
            <div className="ticker-item">SENSEX<span className="ticker-val">74,119.40</span><span className="ticker-up">▲ 0.28%</span></div>
            <div className="ticker-item">USD/INR<span className="ticker-val">₹83.42</span><span className="ticker-down">▼ 0.12%</span></div>
            <div className="ticker-item">GOLD<span className="ticker-val">₹71,240/10g</span><span className="ticker-up">▲ 0.54%</span></div>
            <div className="ticker-item">HDFC BANK<span className="ticker-val">₹1,642.30</span><span className="ticker-up">▲ 1.24%</span></div>
            <div className="ticker-item">RELIANCE<span className="ticker-val">₹2,954.20</span><span className="ticker-up">▲ 0.87%</span></div>
          </div>
          <div className="ticker-content" aria-hidden="true">
            <div className="ticker-item">NIFTY 50<span className="ticker-val">22,456.80</span><span className="ticker-up">▲ 0.34%</span></div>
            <div className="ticker-item">SENSEX<span className="ticker-val">74,119.40</span><span className="ticker-up">▲ 0.28%</span></div>
            <div className="ticker-item">USD/INR<span className="ticker-val">₹83.42</span><span className="ticker-down">▼ 0.12%</span></div>
            <div className="ticker-item">GOLD<span className="ticker-val">₹71,240/10g</span><span className="ticker-up">▲ 0.54%</span></div>
            <div className="ticker-item">HDFC BANK<span className="ticker-val">₹1,642.30</span><span className="ticker-up">▲ 1.24%</span></div>
            <div className="ticker-item">RELIANCE<span className="ticker-val">₹2,954.20</span><span className="ticker-up">▲ 0.87%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
