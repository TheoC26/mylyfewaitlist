/**
 * Shared facts for the Privacy Policy and Terms of Service.
 *
 * Kept in one place because these appear many times across both documents and
 * MUST agree — a governing-law clause that contradicts itself between pages is
 * the kind of thing an opposing lawyer opens with.
 *
 * ⚠️ CHECK `PROVIDER_NAME` BEFORE DEPLOYING. It has to be the full legal name
 * you would sign a contract under, because that is exactly what it is doing.
 */

/** Full legal name of the individual operating the service. */
export const PROVIDER_NAME = "Theodore Chan";

/** How the service is referred to publicly. */
export const SERVICE_NAME = "MyLyfe";

/** Legal counterparty. No entity exists yet, so this is a sole proprietorship. */
export const PROVIDER_LEGAL = `${PROVIDER_NAME}, doing business as ${SERVICE_NAME}`;

export const CONTACT_EMAIL = "team.mylyfe@gmail.com";

/**
 * Governing law. New York while unincorporated — it should be where the
 * operator actually is, not a state picked for prestige.
 *
 * On forming a Delaware entity, change these two lines and the assignment
 * clause in the Terms carries existing users over. Note that Delaware
 * incorporation does not by itself require Delaware governing law; if you keep
 * operating from New York, New York law may still be the better choice for
 * consumer terms. Worth one conversation with a lawyer at that point.
 */
export const GOVERNING_STATE = "New York";
export const VENUE = "New York";

/** Minimum age. Matches the age gate in the app's sign-up flow. */
export const MIN_AGE = 13;

/** Ceiling on total liability, in USD. */
export const LIABILITY_CAP = 100;

/** Days a user has to opt out of arbitration after first accepting. */
export const ARBITRATION_OPT_OUT_DAYS = 30;

export const LAST_UPDATED = "August 7, 2026";
