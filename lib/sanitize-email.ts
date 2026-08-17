// Trims stray whitespace and a trailing dot (e.g. "user@gmail.com.") that
// browsers accept as a syntactically-valid email but mail servers reject
// with "553 5.1.3 invalid mailbox syntax".
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\.+$/, "");
}
