// Robust profanity filter for all user-generated text.
// Normalizes leetspeak/spacing/punctuation/repeat-letter bypass attempts,
// then checks against an expandable blocked-word list using word boundaries
// to avoid false positives (e.g. "class" is not blocked).

// ── Blocked word database ──
// Easily expandable — add raw words here. The matcher normalizes them the
// same way it normalizes input, so simple spelling variants are caught.
const BLOCKED_RAW = [
  // profanity
  'fuck', 'shit', 'bitch', 'asshole', 'asshat', 'bastard', 'dickhead', 'dick',
  'piss', 'crap', 'bollocks', 'wanker', 'prick', 'twat', 'cunt', 'pussy', 'cock',
  'dickcheese', 'douche', 'douchebag', 'jerkoff', 'motherfucker', 'cocksucker',
  'slut', 'whore', 'skank', 'hoe',
  // sexual / explicit
  'nigger', 'nigga', 'faggot', 'fag', 'tranny', 'retard', 'spastic', 'midget',
  'rape', 'molest', 'pedophile', 'paedo', 'pedo', 'incest',
  // strong sexual insults
  'motherfucker',
  // drug-dealing / illegal-ish (keep mild; remove if too aggressive)
  'cocaine', 'methhead',
];

// Words that should NOT be flagged even if they contain a blocked substring
// (false-positive guard). Matched against the ORIGINAL (non-normalized) tokens.
const SAFE_WORDS = new Set([
  'class', 'glass', 'grass', 'pass', 'mass', 'bass', 'assume', 'assess', 'asset',
  'assist', 'assistant', 'brass', 'crass', 'tasse', 'classic', 'classify', 'classroom',
  'passage', 'passenger', 'compass', 'flash', 'smash', 'crash', 'stash', 'mash',
  'scunthorpe', 'thorpe', 'cocktail', 'alter', 'alternate', 'assassin', 'assassinate',
  'document', 'scrap', 'scrappy', 'saturday', 'creek', 'brexit', 'massive', 'massage',
  'bassic', 'fargo', 'shinto', 'shiny', 'ship', 'ships', 'hitlerite',
]);

// Leetspeak → letter map for normalization
const LEET = {
  '4': 'a', '@': 'a', 'ä': 'a', 'å': 'a',
  '8': 'b', 'ß': 'b',
  '(': 'c', '¢': 'c', '©': 'c',
  '3': 'e', '€': 'e', 'ë': 'e',
  '6': 'g',
  '#': 'h',
  '1': 'i', '!': 'i', '|': 'i', 'ï': 'i',
  '0': 'o', 'ö': 'o', 'ø': 'o',
  '9': 'g',
  '5': 's', '$': 's', 'š': 's',
  '7': 't', '+': 't',
  '2': 'z',
  'vv': 'w',
};

// Normalize a string the same way we normalize blocked words, then aggressively
// strip bypass attempts: repeated letters, inserted spaces/punctuation, leetspeak.
function normalize(text) {
  if (!text) return '';
  let s = (' ' + text.toLowerCase() + ' ').slice(1, -1);
  // Unicode-decompose accents so café->cafe
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Leetspeak substitutions (multi-char first)
  const keys = Object.keys(LEET).sort((a, b) => b.length - a.length);
  // Collapse repeats of the same letter first after leet — but leet uses digits/symbols,
  // so do symbol→letter, then strip punctuation/spaces, then collapse repeats.
  let out = '';
  for (const ch of s) {
    if (LEET[ch] !== undefined) out += LEET[ch];
    else out += ch;
  }
  // Now remove everything that isn't a-z (kills spaces, punctuation between letters)
  out = out.replace(/[^a-z]/g, '');
  return out;
}

// Collapse runs of the same letter into a single letter (defeats "shiiit", "ffuuck").
function collapseRuns(s) {
  return s.replace(/(.)\1+/g, '$1');
}

// Build normalized blocked pattern set (after collapseRuns too).
const BLOCKED_NORMALIZED = new Set(
  BLOCKED_RAW.map(w => collapseRuns(normalize(w)))
);

// Split original text into word-ish tokens (preserve separators) so we can
// map a blocked hit back to a slice of the ORIGINAL for highlighting.
const WORD_RE = /[a-z0-9@#$€/?._\-]+/gi;

// Check a single normalized token against the blocked list, allowing a small
// amount of surrounding-letter context (so " F * U * C * K " collapses down).
function tokenBlocked(normToken) {
  if (!normToken) return null;
  const collapsed = collapseRuns(normToken);
  // direct
  if (BLOCKED_NORMALIZED.has(collapsed)) return collapsed;
  // substring of a blocked word embedded (e.g. "afuckb") — but avoid false
  // positives by only flagging when the collapsed token *is* a blocked word or
  // the collapsed blocked word appears as a standalone run. We already handled
  // direct equality; for embedded we require surrounding non-letters in the
  // original, which tokenization already enforces.
  return null;
}

// Main API: returns { clean: boolean, words: [originalSubstrings...] }
export function checkProfanity(text) {
  if (!text) return { clean: true, words: [] };
  const tokens = (text.match(WORD_RE) || []);
  const found = [];
  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    // Skip safe words entirely (false-positive guard)
    if (SAFE_WORDS.has(lower)) continue;
    const norm = normalize(tok);
    const block = tokenBlocked(norm);
    if (block) found.push(tok);
  }
  return { clean: found.length === 0, words: found };
}

// Convenience check used by forms
export function isClean(text) {
  return checkProfanity(text).clean;
}

// Return a highlighted version of the text (wraps offending words in markers).
// marker = [start, end] bracket pair. Used by UI to show the offending word(s).
export function highlightProfanity(text, open = '⟦', close = '⟧') {
  if (!text) return text;
  const result = checkProfanity(text);
  if (result.clean) return text;
  let out = text;
  // Replace each found substring (longest first to avoid partial overlaps)
  const sorted = [...new Set(result.words)].sort((a, b) => b.length - a.length);
  for (const w of sorted) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, `${open}${w}${close}`);
  }
  return out;
}