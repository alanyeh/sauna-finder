// Conservative suggestions, not verification. Keep sources separate so a
// sentence from one review cannot run into a sentence from another review.
const PATTERNS = {
  cold_plunge: /\b(?:cold\s*(?:plunge|pool|tub|dip|immersion)|ice\s*bath|frigidarium)\b/i,
  steam_room: /\b(?:steam\s*(?:room|bath)|eucalyptus\s*steam|hammam|turkish\s*bath)\b/i,
  dry_sauna: /\b(?:dry|heated|traditional|finnish|cedar|wood(?:[\s-]*fired)?|barrel)\s*sauna\b/i,
  infrared_sauna: /\binfrared\s*(?:sauna|room|cabin|pod)\b/i,
  pool: /\b(?:swimming\s*pool|lap\s*pool|hot\s*tub|jacuzzi|whirlpool|soaking\s*(?:tub|pool)|thermal\s*pool|rooftop\s*pool|outdoor\s*pool|indoor\s*pool)\b/i,
  massage: /\b(?:massage|body\s*scrub)\b/i,
  coed: /\b(?:co[-\s]?ed|mixed[-\s]?gender|all\s*genders?)\b/i,
  private: /\bprivate\s*(?:sauna|session|cabin|pod|bath|experience)\b/i,
};

// Prefer missing a suggestion to publishing an explicitly unavailable amenity.
// This is intentionally sentence-level, and cannot resolve all natural language.
const UNCERTAIN = /\b(?:no|not|without|never|removed|closed|paused|on\s+pause|suspended|broken|unavailable|wish|wished|wishful|hope|hopefully|planned|planning|upcoming|formerly|used\s+to|out\s+of\s+(?:order|service)|coming\s+soon|doesn['’]?t|don['’]?t|didn['’]?t|isn['’]?t|wasn['’]?t|aren['’]?t)\b/i;

export function inferAmenityEvidence(sources) {
  const sentences = sources.flatMap(source => String(source || '').split(/[.!?\n]+/))
    .map(sentence => sentence.trim()).filter(Boolean);
  const evidence = {};
  for (const [amenity, pattern] of Object.entries(PATTERNS)) {
    const matches = sentences.filter(sentence => pattern.test(sentence));
    if (matches.length && !matches.some(sentence => UNCERTAIN.test(sentence))) {
      evidence[amenity] = matches[0];
    }
  }
  return evidence;
}

export function placeTextSources(place) {
  return [place.displayName?.text, place.editorialSummary?.text,
    ...(place.reviews || []).map(review => review.text?.text || review.originalText?.text)];
}

export function hasSaunaEvidence(sources) {
  const mentions = sources.flatMap(source => String(source || '').split(/[.!?\n]+/))
    .filter(sentence => /\b(?:sauna|steam\s*room|banya|hammam|bathhouse)\b/i.test(sentence));
  return mentions.length > 0 && !mentions.some(sentence => UNCERTAIN.test(sentence));
}
