/**
 * Baseline lexical filter for explicit / disallowed prompt content.
 * This is a first line of defense before a prompt reaches Seedream or OpenAI —
 * it is not a substitute for the provider-side moderation those APIs already run.
 */

/**
 * Builds a case-insensitive, whole-word regex from a curated term list.
 * Terms are written as regex fragments directly (not literal strings) so
 * entries like `decapitat\w*` or `\d{1,2}\s*year...` work as intended —
 * do not add raw user input to these lists.
 */
function toPattern(terms: string[]): RegExp {
  return new RegExp(`\\b(?:${terms.map((t) => t.trim()).join('|')})\\b`, 'i');
}

/** General profanity / vulgar language. */
const PROFANITY = [
  'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit', 'bitch', 'bastard',
  'asshole', 'ass hole', 'dick', 'dickhead', 'prick', 'cunt', 'twat', 'douchebag',
  'piss off', 'wanker', 'bollocks',
];

/** Sexual / pornographic content. */
const SEXUAL = [
  'porn', 'pornographic', 'pornography', 'hentai', 'nude', 'nudes', 'nudity', 'naked',
  'topless', 'sex', 'sexual', 'sexually explicit', 'nsfw', 'xxx', 'erotic', 'erotica',
  'orgasm', 'orgy', 'masturbat\\w*', 'genitals', 'genitalia', 'penis', 'vagina', 'pussy',
  'cock', 'dildo', 'blowjob', 'handjob', 'cum shot', 'cumshot', 'fetish', 'bdsm',
  'bestiality', 'incest', 'rape', 'raping', 'molest\\w*', 'prostitut\\w*', 'escort service',
  'strip club', 'stripper', 'camgirl', 'onlyfans',
];

/** Hate speech / slurs (racial, ethnic, religious, gender, disability, sexuality). */
const HATE_SLURS = [
  'nigger', 'nigga', 'chink', 'gook', 'spic', 'wetback', 'kike', 'raghead', 'towelhead',
  'paki', 'coon', 'faggot', 'fag', 'dyke', 'tranny', 'retard', 'retarded', 'cripple',
  'sand nigger',
];

/** Extreme violence, gore, self-harm and terrorism-adjacent instruction content. */
const VIOLENCE = [
  'gore', 'decapitat\\w*', 'mutilat\\w*', 'disembowel\\w*', 'dismember\\w*', 'torture',
  'behead\\w*', 'self harm', 'self-harm', 'suicide', 'kill yourself', 'kys',
  'mass shooting', 'school shooting', 'bomb making', 'how to make a bomb',
  'terrorist attack', 'ethnic cleansing', 'genocide',
];

/** References to minors — combined with SEXUAL below to hard-block CSAM-adjacent prompts. */
const MINOR_TERMS = [
  'child', 'children', 'kid', 'kids', 'toddler', 'infant', 'baby', 'minor', 'minors',
  'underage', 'under age', 'schoolgirl', 'schoolboy', 'preteen', 'pre-teen', 'tween',
  'loli', 'shota',
  '\\d{1,2}\\s*(?:-|\\s)?\\s*year(?:-|\\s)?old',
];

const explicitPattern = toPattern([...PROFANITY, ...SEXUAL, ...HATE_SLURS, ...VIOLENCE]);
const minorPattern = toPattern(MINOR_TERMS);
const sexualOrNudityPattern = toPattern(SEXUAL);

export type ContentFilterResult = {
  blocked: boolean;
  reason?: string;
};

/**
 * Checks free-form prompt text for explicit / disallowed content.
 * Returns { blocked: true, reason } if the prompt should be rejected.
 */
export function checkPromptContent(text: string | null | undefined): ContentFilterResult {
  const value = (text ?? '').trim();
  if (!value) return { blocked: false };

  // Hard block: any combination of a minor reference with sexual/nudity content.
  if (minorPattern.test(value) && sexualOrNudityPattern.test(value)) {
    return {
      blocked: true,
      reason: 'This prompt violates our content policy and cannot be generated.',
    };
  }

  if (explicitPattern.test(value)) {
    return {
      blocked: true,
      reason:
        'Your prompt contains explicit or restricted language. Please rephrase it and try again.',
    };
  }

  return { blocked: false };
}
