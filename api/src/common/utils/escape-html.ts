const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for safe interpolation into HTML content and quoted attributes (e.g. e-mails). */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}
