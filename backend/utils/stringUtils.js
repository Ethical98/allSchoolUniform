/**
 * String Utility Functions
 * Common string manipulation utilities for the application
 */

/**
 * Normalize whitespace - trims and collapses multiple spaces to single space
 * @param {string} str - The input string
 * @returns {string} - The normalized string
 */
export const normalizeWhitespace = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Create a URL-friendly slug from a string
 * - Converts to lowercase
 * - Replaces spaces and underscores with dashes
 * - Removes special characters
 * - Collapses multiple dashes to single dash
 * @param {string} str - The input string
 * @returns {string} - The slugified string
 */
export const slugify = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with dashes
    .replace(/_+/g, '-')            // Replace underscores with dashes
    .replace(/[^a-z0-9-]/g, '')     // Remove special characters
    .replace(/-+/g, '-')            // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '');         // Remove leading/trailing dashes
};

/**
 * Create a slugified filename with timestamp
 * @param {string} originalFilename - The original filename (with extension)
 * @returns {string} - The slugified filename with timestamp
 */
export const slugifyFilename = (originalFilename) => {
  if (!originalFilename || typeof originalFilename !== 'string') return '';
  
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? originalFilename.slice(0, lastDotIndex) : originalFilename;
  const extension = lastDotIndex > 0 ? originalFilename.slice(lastDotIndex).toLowerCase() : '';
  
  const slugifiedName = slugify(name);
  return `${slugifiedName}-${Date.now()}${extension}`;
};

/**
 * Normalize a URL path to use forward slashes
 * @param {string} urlPath - The URL path to normalize
 * @returns {string} - Normalized URL path with forward slashes
 */
export const normalizePathSlashes = (urlPath) => {
  if (!urlPath || typeof urlPath !== 'string') return urlPath;
  return urlPath.replace(/\\/g, '/').replace(/\/+/g, '/');
};
