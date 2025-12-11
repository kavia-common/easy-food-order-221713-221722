import { ParsedFilters, VoiceIntent, VoiceFulfillment } from '@/types/voice';

// Basic lexicons for cuisines and verbs.
// Add more cuisines/keywords as needed for the demo footprint.
const CUISINES = [
  'indian',
  'chinese',
  'italian',
  'japanese',
  'mexican',
  'mediterranean',
  'greek',
  'asian',
  'thai',
  'korean',
  'pizza',
  'burger',
];

const ORDER_VERBS = [
  'order',
  'buy',
  'get me',
  'i want',
  'add',
  'place order',
  'book',
];

const FULFILLMENT: Array<{ key: VoiceFulfillment; words: string[] }> = [
  { key: 'delivery', words: ['deliver', 'delivery', 'send', 'home delivery'] },
  { key: 'pickup', words: ['pickup', 'pick up', 'self pickup', 'takeaway', 'take away', 'take-out', 'take out'] },
];

const PRICE_PATTERNS = [
  // under 200, below 300, less than 150
  /\b(under|below|less than)\s*(₹?\s*\d{1,5})\b/gi,
  // up to 250
  /\b(up to)\s*(₹?\s*\d{1,5})\b/gi,
  // maximum 300
  /\b(max(?:imum)?)\s*(₹?\s*\d{1,5})\b/gi,
];

// PUBLIC_INTERFACE
export function parseVoice(transcriptRaw: string): ParsedFilters {
  /**
   * PUBLIC_INTERFACE
   * Parses a transcript string into a structured ParsedFilters object.
   * Handles:
   * - cuisines: using a small lexicon
   * - dish keywords: remaining non-stop words and any phrase containing known cuisine tokens like "pizza"
   * - price ceilings: "under 200", "₹250", "under ₹300 rupees"
   * - near me flag: "near me", "nearby", "around me"
   * - fulfillment: 'delivery' or 'pickup' words
   * - order verbs to set order intent
   * - currency inference: if '₹' or 'rupee(s)' appear, mark as 'INR'
   */
  const transcript = String(transcriptRaw || '').trim();
  const lc = transcript.toLowerCase();

  // Currency inference
  const mentionsInr = lc.includes('rupee') || lc.includes('rs ') || lc.includes('rs.') || lc.includes('inr') || lc.includes('₹');

  // Fulfillment
  let fulfillment: VoiceFulfillment = undefined;
  for (const group of FULFILLMENT) {
    if (group.words.some((w) => lc.includes(w))) {
      fulfillment = group.key;
      break;
    }
  }

  // Max price detection
  let maxPrice: number | undefined = undefined;
  let currency: 'INR' | 'DEFAULT' | undefined = mentionsInr ? 'INR' : undefined;

  // Direct price tokens like "₹200", "200 rupees"
  const directRupeeMatch = lc.match(/₹\s*(\d{1,6})/);
  if (directRupeeMatch) {
    maxPrice = parseInt(directRupeeMatch[1], 10);
    currency = 'INR';
  } else {
    const rupeesAfter = lc.match(/\b(\d{1,6})\s*(rs\.?|rupees?|inr)\b/);
    if (rupeesAfter) {
      maxPrice = parseInt(rupeesAfter[1], 10);
      currency = 'INR';
    }
  }
  if (typeof maxPrice !== 'number') {
    // Try "under/below/less than/up to/max 200" styles
    for (const rx of PRICE_PATTERNS) {
      const m = rx.exec(lc);
      if (m && m[2]) {
        const numeric = String(m[2]).replace(/[^\d]/g, '');
        if (numeric) {
          maxPrice = parseInt(numeric, 10);
          break;
        }
      }
    }
  }

  // Near me
  const nearMe = /\b(near me|nearby|around me|close by|closest)\b/.test(lc);

  // Order verbs
  const hasOrderVerb = ORDER_VERBS.some((v) => lc.includes(v));

  // Cuisines detected
  const cuisines = CUISINES.filter((c) => lc.includes(c)).map((c) => titleCase(c));

  // Heuristic for keywords: take words not in stop list and include known cuisine-like dishes
  const stop = new Set(['me', 'show', 'find', 'near', 'nearby', 'around', 'please', 'for', 'to', 'the', 'a', 'an', 'some', 'want', 'i', 'under', 'below', 'less', 'than', 'upto', 'up', 'maximum', 'max', 'order', 'buy', 'get', 'add', 'deliver', 'delivery', 'pickup', 'takeaway', 'take', 'away', 'send', 'home', 'with', 'and', 'on']);
  const keywords = Array.from(
    new Set(
      transcript
        .split(/[\s,]+/)
        .map((w) => w.trim())
        .filter(Boolean)
        .filter((w) => !stop.has(w.toLowerCase()))
    )
  );

  // Determine intent
  let intent: VoiceIntent = 'search_restaurants';
  // If mentions 'menu' or specific dish words -> search_items, and if order verb present -> order_item
  const mentionsMenu = /\b(menu|item|items|dish|dishes)\b/.test(lc);
  const cuisineMentioned = cuisines.length > 0;
  const hasDishyWord = keywords.some((k) => CUISINES.includes(k.toLowerCase()) || /\b(pizza|biryani|burger|noodles|pasta|roll|dosa|idli|thali|paneer|chicken|momos)\b/i.test(k));
  if (hasOrderVerb && hasDishyWord) {
    intent = 'order_item';
  } else if (mentionsMenu || hasDishyWord) {
    intent = 'search_items';
  } else if (cuisineMentioned || nearMe) {
    intent = 'search_restaurants';
  } else {
    intent = 'unknown';
  }

  return {
    transcript,
    keywords,
    cuisines,
    maxPrice,
    currency,
    nearMe,
    fulfillment,
    intent,
    hasOrderVerb,
  };
}

function titleCase(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
