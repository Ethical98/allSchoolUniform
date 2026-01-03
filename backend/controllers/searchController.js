import asyncHandler from 'express-async-handler';
import Product from '../models/ProductModel.js';
import School from '../models/SchoolModel.js';
import ProductType from '../models/ProductTypesModel.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';

// @desc    Universal search across products, schools, and types
// @route   GET /api/search?q=term&limit=5
// @access  Public
const universalSearch = asyncHandler(async (req, res) => {
    const { q, limit = 5 } = req.query;

    // Validate query
    if (!q || q.trim().length < 2) {
        return res.json({
            query: q || '',
            results: {
                products: [],
                schools: [],
                types: [],
            },
            totalCount: 0,
        });
    }

    const searchTerm = q.trim();
    const limitNum = Math.min(Math.max(Number(limit) || 5, 1), 10);

    // Create case-insensitive regex for search
    const searchRegex = new RegExp(searchTerm, 'i');

    // Execute all searches in parallel for performance
    const [products, schools, types] = await Promise.all([
        // Search products by name, SKU, type, brand, SEOKeywords
        Product.find({
            isActive: true,
            $or: [
                { name: searchRegex },
                { SKU: searchRegex },
                { type: searchRegex },
                { brand: searchRegex },
                { category: searchRegex },
                { SEOKeywords: searchRegex },
                { schoolName: searchRegex },
            ],
        })
            .select('name image type schoolName size brand category')
            .limit(limitNum)
            .lean(),

        // Search schools by name, city, state
        School.find({
            isActive: true,
            $or: [
                { name: searchRegex },
                { city: searchRegex },
                { state: searchRegex },
            ],
        })
            .select('name logo city state')
            .limit(limitNum)
            .lean(),

        // Search product types
        ProductType.find({
            isActive: true,
            type: searchRegex,
        })
            .select('type image')
            .limit(limitNum)
            .lean(),
    ]);

    // Calculate minimum price for products and normalize image URLs
    const productsWithPrice = products.map((product) => {
        const prices = product.size
            ?.filter((s) => s.price > 0)
            .map((s) => s.price) || [];
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;

        return {
            _id: product._id,
            name: product.name,
            image: normalizeUrl(product.image),
            type: product.type,
            brand: product.brand,
            category: product.category,
            schoolName: product.schoolName?.[0] || null,
            minPrice,
        };
    });

    // Normalize school and type images
    const normalizedSchools = schools.map((s) => ({ ...s, logo: normalizeUrl(s.logo) }));
    const normalizedTypes = types.map((t) => ({ ...t, image: normalizeUrl(t.image) }));

    const totalCount = products.length + schools.length + types.length;

    res.json({
        query: searchTerm,
        results: {
            products: productsWithPrice,
            schools: normalizedSchools,
            types: normalizedTypes,
        },
        totalCount,
    });
});

// @desc    Get search suggestions (lightweight)
// @route   GET /api/search/suggestions?q=term
// @access  Public
const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.json({ suggestions: [] });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(`^${searchTerm}`, 'i'); // Starts with for suggestions

    // Get unique suggestions from different sources
    const [productNames, schoolNames, typeNames] = await Promise.all([
        Product.find({ isActive: true, name: searchRegex })
            .select('name')
            .limit(3)
            .lean(),
        School.find({ isActive: true, name: searchRegex })
            .select('name')
            .limit(3)
            .lean(),
        ProductType.find({ isActive: true, type: searchRegex })
            .select('type')
            .limit(2)
            .lean(),
    ]);

    const suggestions = [
        ...productNames.map((p) => ({ text: p.name, type: 'product' })),
        ...schoolNames.map((s) => ({ text: s.name, type: 'school' })),
        ...typeNames.map((t) => ({ text: t.type, type: 'type' })),
    ];

    res.json({ suggestions });
});

export { universalSearch, getSearchSuggestions };
