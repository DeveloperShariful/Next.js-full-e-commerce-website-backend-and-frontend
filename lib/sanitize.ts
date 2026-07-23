// lib/sanitize.ts
// Safe HTML sanitizer for user-generated content (reviews, comments).
// Used instead of DOMPurify to avoid an extra dependency.
// Strategy: strip ALL HTML, then only allow <br> for line breaks.

/**
 * Removes all HTML tags and dangerous patterns from a string.
 * Safe to use on any user-submitted text before saving to DB or rendering.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return '';
  return (
    input
      // Remove <script>...</script> blocks and their content entirely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove <style>...</style> blocks and their content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove all remaining HTML tags (e.g. <img>, <a>, <b>, <iframe>…)
      .replace(/<[^>]+>/g, '')
      // Remove javascript: and vbscript: protocol references
      .replace(/javascript\s*:/gi, '')
      .replace(/vbscript\s*:/gi, '')
      // Remove data: URIs (used to embed malicious payloads)
      .replace(/data\s*:[^,]*,/gi, '')
      // Guard against HTML-entity-encoded <script (e.g. &lt;script)
      .replace(/&lt;\s*script/gi, '')
      .replace(/&#x3C;\s*script/gi, '')
      .trim()
  );
}

/**
 * Converts plain user text to safe HTML that can be used with
 * dangerouslySetInnerHTML — only <br> tags are ever emitted.
 *
 * Usage:
 *   <div dangerouslySetInnerHTML={{ __html: textToSafeHtml(review.content) }} />
 */
export function textToSafeHtml(input: string | null | undefined): string {
  if (!input) return '';

  // 1. Strip all HTML first
  const clean = stripHtml(input);

  // 2. Escape the five dangerous HTML characters so nothing can be injected
  const escaped = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // 3. Convert newline characters to <br> — the ONLY HTML tag we ever emit
  return escaped.replace(/\n/g, '<br>');
}
