/**
 * Normalize URL paths by replacing backslashes with forward slashes.
 * This ensures URLs work correctly on Linux-based servers (like Vercel)
 * where backslashes are not valid path separators.
 *
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL with forward slashes
 */
const normalizeUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    return url.replace(/\\/g, '/');
};

/**
 * Normalize image URLs in a product object.
 * Handles both single image strings and arrays of images.
 *
 * @param {Object} product - The product object to normalize
 * @returns {Object} - The product with normalized image URLs
 */
const normalizeProductImages = (product) => {
    if (!product) return product;

    const normalized = { ...product };

    // Normalize single image field
    if (normalized.image) {
        normalized.image = normalizeUrl(normalized.image);
    }

    // Normalize images array if present
    if (Array.isArray(normalized.images)) {
        normalized.images = normalized.images.map((img) =>
            typeof img === 'string' ? normalizeUrl(img) : { ...img, url: normalizeUrl(img.url) }
        );
    }

    return normalized;
};

/**
 * Normalize image URLs in an array of products.
 *
 * @param {Array} products - Array of product objects
 * @returns {Array} - Array of products with normalized image URLs
 */
const normalizeProductsImages = (products) => {
    if (!Array.isArray(products)) return products;
    return products.map(normalizeProductImages);
};

export { normalizeUrl, normalizeProductImages, normalizeProductsImages };
