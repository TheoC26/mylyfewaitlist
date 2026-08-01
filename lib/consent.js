/**
 * The exact words someone agrees to before their video can go on the homepage.
 *
 * Kept as a versioned constant, and the version is stored on the row, because
 * the Terms of Service promise ("We will not use your content in marketing or
 * advertising without asking you first") is only worth anything if we can say
 * later precisely what was asked. Change the copy, add a version — never edit
 * an existing one in place, or every row already stamped with it starts
 * claiming agreement to words nobody saw.
 */

export const CONSENT_VERSION = "v1";

export const CONSENT_TEXT_V1 =
  "I own this video and everyone in it is okay with it appearing publicly on mylyfeapp.com.";

/** version -> text, so an old stamp stays resolvable after the copy moves on. */
export const CONSENT_TEXTS = {
  v1: CONSENT_TEXT_V1,
};
