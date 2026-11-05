/**
 * Switches for features that are not ready yet. Each is off until the feature really
 * works end to end; turning one on is a one-line change here.
 */
export const FEATURES = {
  /** Phone OTP needs an SMS gateway (SMS_API_KEY); magic links need an email sender (EMAIL_API_KEY). */
  passwordlessLogin: false,
  /** Google sign-in needs an OAuth client set up. */
  googleSignIn: false,
  /** "Founding Pro" / trial badges: there is no paid plan or billing yet. */
  trialPromo: false,
} as const;
