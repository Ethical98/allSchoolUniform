/* eslint-disable import/no-commonjs */
const { writeFileSync } = require('fs');
const prettier = require('prettier');
const axios = require('axios');
const { join, split, lowerCase } = require('lodash');

// JSON

const generateSitemap = async () => {
    const sitemapData = [
        'aboutus',
        'contactus',
        'policies-and-help-guide#privacy-policy',
        'policies-and-help-guide#terms-and-conditions',
        'policies-and-help-guide#payment-methods',
        'policies-and-help-guide#cancellations-exchanges-and-returns',
        'policies-and-help-guide#shipping-and-delivery-policy'
    ];

    const { data } = await axios.get('https://allschooluniform.com/api/products');
    data.products.forEach((item) => sitemapData.push(`products/${join(split(lowerCase(item.name), ' '), '-')}`));
    const config = {
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxMjYzODA4YzFhZmE3M2ExOGVlZDJiYSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwiaWF0IjoxNzEwMDc4ODQ3LCJleHAiOjE3MTAxNjUyNDd9.k3W6HimqenmIuqfgSXYPa9rB1eIYyF-N5jM0a-aNr74`
        }
    };

    for (let i = 2; i <= data.pages; i++) {
        const { data } = await axios.get(`https://allschooluniform.com/api/products?pageNumber=${i}`);
        data.products.forEach((item) => sitemapData.push(`products/${join(split(lowerCase(item.name), ' '), '-')}`));
    }

    const { data: schoolData } = await axios.get('https://allschooluniform.com/api/schools', config);
    schoolData.schools.forEach((item) =>
        sitemapData.push(`products/schools/${join(split(lowerCase(item.name), ' '), '-')}`)
    );

    for (let i = 2; i <= schoolData.pages; i++) {
        const { data: schoolData } = await axios.get(`https://allschooluniform.com/api/schools?pageNumber=${i}`, config);
        schoolData.schools.forEach((item) =>
            sitemapData.push(`products/schools/${join(split(lowerCase(item.name), ' '), '-')}`)
        );
    }

    const prettierConfig = await prettier.resolveConfig('../../../.prettierrc.js');
    const BASE_URL = 'https://allschooluniform.com/';

    /**
     * Get Date in YYYY-MM-DD Format
     * @param {String} date
     * @returns {String} Formatted Date
     */
    const getDateInYearMonthDate = () => {
        const formattedDate = new Date().toISOString().split('T')[0];

        return formattedDate;
    };

    const sitemap = `<?xml version="1.0" encoding="utf-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${getDateInYearMonthDate()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    </url>
    ${sitemapData
        .map((item) => {
            return `<url>
    <loc>${`${BASE_URL}${item}`}</loc>
    <lastmod>${getDateInYearMonthDate()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    </url>`;
        })
        .join(' ')}
    </urlset>`;

    const formatted = await prettier.format(sitemap, {
        ...prettierConfig,
        parser: 'html'
    });

    writeFileSync('frontend/public/sitemap.xml', formatted);
};

generateSitemap();
