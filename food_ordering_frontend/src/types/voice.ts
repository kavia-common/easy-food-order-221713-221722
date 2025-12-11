//
// Voice search related shared types
//

export type CurrencyCode = 'INR' | 'DEFAULT';

export type VoiceFulfillment = 'delivery' | 'pickup' | undefined;

export type VoiceIntent =
  | 'search_restaurants'
  | 'search_items'
  | 'order_item'
  | 'unknown';

// PUBLIC_INTERFACE
export type ParsedFilters = {
  /** Raw transcript that was parsed */
  transcript: string;
  /** Extracted free text keywords (e.g., "biryani", "veg pizza") */
  keywords: string[];
  /** Cuisine terms normalized to Title Case (e.g., "Indian", "Chinese") */
  cuisines: string[];
  /** Maximum price ceiling interpreted from the utterance */
  maxPrice?: number;
  /** Currency for the above price. If INR is inferred, it's 'INR', otherwise 'DEFAULT'. */
  currency?: CurrencyCode;
  /** Whether the user asked for nearby results ("near me") */
  nearMe?: boolean;
  /** Optional fulfillment preference discovered in utterance */
  fulfillment?: VoiceFulfillment;
  /** Primary intent (search restaurants/items or order directly) */
  intent: VoiceIntent;
  /** When intent is 'order_item', indicates user expressed an action verb like 'order' */
  hasOrderVerb?: boolean;
};

// PUBLIC_INTERFACE
export type VoiceQuery = {
  /** Final transcript text */
  transcript: string;
  /** Flags about recognition results */
  final: boolean;
  /** Parsed filters derived from the transcript */
  parsed: ParsedFilters;
};
