// The abandoned-checkout capture endpoint saves whatever the customer has
// typed so far, debounced 2s after each keystroke (see CheckoutClient.tsx) —
// so a brief pause mid-domain (e.g. right after "user@gmail.c", before
// finishing "om") gets captured as a syntactically-plausible-looking email
// and stored. If the customer then finishes typing, the corrected address
// is captured as a *separate* row (capture matches on exact email string),
// leaving the truncated one dangling and still eligible for reminders that
// will only ever bounce. Auto-correcting well-known providers here — the
// single choke point every intake path already runs through — fixes it
// before it's ever written to the DB, for whichever the caller happens to
// be (abandoned-checkout capture, order creation, etc).
const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.com.au",
  "outlook.com",
  "outlook.com.au",
  "live.com",
  "live.com.au",
  "yahoo.com",
  "yahoo.com.au",
  "icloud.com",
  "me.com",
  "bigpond.com",
  "optusnet.com.au",
  "aol.com",
  "msn.com",
  "protonmail.com",
  "gmx.com",
];

// Only attempts a fix when the domain's final segment is 0-1 chars — a
// strong signal of "cut off mid-word", not a real (if unfamiliar) TLD.
// A 2+ char ending (e.g. "gmail.co", "site.io") is left alone: it's
// syntactically a complete, plausible domain, and guessing at those risks
// silently rewriting someone's actual (if unusual) address.
function autocorrectTruncatedDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at === -1) return email;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const lastSegment = domain.split(".").pop() ?? "";
  if (lastSegment.length >= 2) return email;

  const candidates = COMMON_EMAIL_DOMAINS.filter(d => d.startsWith(domain) && d !== domain);
  if (candidates.length !== 1) return email; // no match, or ambiguous (e.g. "live.c" -> live.com / live.com.au) — leave as-is

  return `${local}@${candidates[0]}`;
}

// Trims stray whitespace and a trailing dot (e.g. "user@gmail.com.") that
// browsers accept as a syntactically-valid email but mail servers reject
// with "553 5.1.3 invalid mailbox syntax".
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase().replace(/\.+$/, "");
  return autocorrectTruncatedDomain(trimmed);
}
