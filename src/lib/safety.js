/**
 * Safety & Crisis Guardrail System
 * Provides immediate hotline resources, keyword detection for high-distress phrases,
 * and de-escalation protocols for ethical mental health AI applications.
 */

export const CRISIS_HOTLINES = [
  {
    country: "United States & Canada",
    name: "988 Suicide & Crisis Lifeline",
    contact: "988",
    type: "call-or-text",
    description: "Free, confidential 24/7 support for anyone in distress or crisis.",
    url: "https://988lifeline.org"
  },
  {
    country: "United States & Canada",
    name: "Crisis Text Line",
    contact: "Text HOME to 741741",
    type: "text",
    description: "Free 24/7 text support with trained crisis counselors.",
    url: "https://www.crisistextline.org"
  },
  {
    country: "United Kingdom",
    name: "Samaritans & NHS 111",
    contact: "Call 116 123 or 111",
    type: "call",
    description: "24/7 free emotional support across the UK and Ireland.",
    url: "https://www.samaritans.org"
  },
  {
    country: "India",
    name: "KIRAN Mental Health Helpline",
    contact: "1800-599-0019",
    type: "call",
    description: "24/7 toll-free mental health rehabilitation and crisis support.",
    url: "https://www.mohfw.gov.in"
  },
  {
    country: "International",
    name: "Befrienders Worldwide / IASP",
    contact: "Find Local Helpline",
    type: "link",
    description: "Global directory of emotional support and suicide prevention hotlines in 130+ countries.",
    url: "https://www.befrienders.org"
  }
];

export const CRISIS_KEYWORDS = [
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bsuicid(e|al)\b/i,
  /\bwant to die\b/i,
  /\bhurt myself\b/i,
  /\bcutting myself\b/i,
  /\bself[- ]harm\b/i,
  /\bcan'?t go on anymore\b/i,
  /\bdon'?t want to live\b/i,
  /\bno reason to live\b/i,
  /\boverdose\b/i
];

/**
 * Checks whether user input matches severe distress/crisis triggers
 * @param {string} text 
 * @returns {boolean}
 */
export function containsCrisisSignals(text) {
  if (!text || typeof text !== 'string') return false;
  return CRISIS_KEYWORDS.some(regex => regex.test(text));
}

/**
 * Generates an empathetic de-escalation safety disclaimer for AI responses
 */
export const CRISIS_DISCLAIMER_TEXT = `> **If you or someone you know is struggling or in crisis, help is available. You are not alone.**
> - **In the US & Canada:** Call or text **988**, or text **HOME to 741741**.
> - **In the UK:** Call **116 123** (Samaritans) or **111** (NHS).
> - **In India:** Call **1800-599-0019** (KIRAN).
> - **International:** Visit [Befrienders Worldwide](https://www.befrienders.org) or call your local emergency services (911, 999, 112).`;
