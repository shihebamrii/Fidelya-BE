/**
 * Utility functions for the Loyalty Card API
 */

/**
 * Escape special characters in a string for use in a RegExp
 * Prevents ReDoS attacks from user-supplied search strings
 * @param {string} string - The string to escape
 * @returns {string} The escaped string safe for use in new RegExp()
 */
const escapeRegExp = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export { escapeRegExp };
