import DOMPurify from 'dompurify';

/**
 * DOMPurify configuration for sanitizing HTML content
 * Whitelist only safe tags and attributes needed for article/blog content
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'b', 'i', 'em', 'strong', 'a', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'img', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'style',
  ],
  ALLOWED_URI_REGEXP: /^(?:(https?:\/\/|\/|\.\.\/|\.\/|\#|[a-zA-Z]))/,
  ADD_ATTR: ['target'], // Allow target="_blank" for links
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
  FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'style'], // No inline event handlers
};

/**
 * Sanitize HTML content with secure configuration
 * @param dirty - The dirty HTML string to sanitize
 * @returns Sanitized safe HTML string
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}

export default PURIFY_CONFIG;
