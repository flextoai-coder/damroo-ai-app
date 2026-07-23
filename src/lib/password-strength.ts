export type PasswordStrengthLabel = 'Weak' | 'Fair' | 'Good' | 'Strong';

export type PasswordStrength = {
  /** 0–4 score used for the meter */
  score: number;
  label: PasswordStrengthLabel;
  /** True when score is at least Fair (2) */
  isAcceptable: boolean;
};

/**
 * Client-side password strength: length ≥ 8, uppercase, lowercase, number, special.
 * Score is clamped to 0–4; empty password is 0 / Weak.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Weak', isAcceptable: false };
  }

  let points = 0;
  if (password.length >= 8) points += 1;
  if (/[A-Z]/.test(password)) points += 1;
  if (/[a-z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  // Map 0–5 checks onto a 0–4 display score
  const score = Math.min(4, Math.max(0, points === 0 ? 0 : points - 1));

  const label: PasswordStrengthLabel =
    score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  return {
    score,
    label,
    isAcceptable: score >= 2,
  };
}
