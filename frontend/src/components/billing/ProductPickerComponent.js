import React, { useEffect, useState } from 'react';
import { Form, ListGroup, Badge, Spinner } from 'react-bootstrap';
import api from '../../utils/api';
import { useSelector } from 'react-redux';

const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '0 0 6px 6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const highlightMatch = (text, query) => {
    if (!query || query.length < 2) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part)
            ? <mark key={i} style={{ padding: 0, backgroundColor: '#fff3cd' }}>{part}</mark>
            : part
    );
};

const ProductPickerComponent = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const [searched, setSearched] = useState(false);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                setLoading(false);
                setSearched(false);
                return;
            }
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await api.get(
                    `/api/billing/quotations/products?search=${query}`,
                    config
                );
                setResults(data);
                setSearched(true);
            } catch (err) {
                // Silently handle search errors — user sees empty results
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query, userInfo]);

    const handleSelect = (product) => {
        setQuery('');
        setResults([]);
        setSearched(false);
        onSelect(product);
    };

    const showHint = focused && query.length > 0 && query.length < 2 && !loading;
    const showNoResults = focused && !loading && searched && query.length >= 2 && results.length === 0;
    const showResults = focused && !loading && results.length > 0;

    return (
        <Form.Group style={{ position: 'relative' }}>
            <Form.Control
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                placeholder="Search product by name or SKU..."
                role="combobox"
                aria-expanded={showResults}
                aria-autocomplete="list"
                aria-label="Search products"
            />

            {/* Loading spinner */}
            {focused && loading && (
                <div style={dropdownStyle}>
                    <div className="text-center p-3 text-muted">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Searching...
                    </div>
                </div>
            )}

            {/* Hint: type more characters */}
            {showHint && (
                <div style={dropdownStyle}>
                    <div className="text-muted p-3 text-center">
                        <small>Type at least 2 characters to search</small>
                    </div>
                </div>
            )}

            {/* No results */}
            {showNoResults && (
                <div style={dropdownStyle}>
                    <div className="text-muted p-3 text-center">
                        No products found for "<strong>{query}</strong>"
                    </div>
                </div>
            )}

            {/* Results list */}
            {showResults && (
                <ListGroup style={dropdownStyle} role="listbox" aria-label="Product search results">
                    {results.map((product) => (
                        <ListGroup.Item
                            key={product._id}
                            action
                            role="option"
                            onClick={() => handleSelect(product)}
                            className="py-2 px-3"
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                                        {highlightMatch(product.name, query)}
                                    </div>
                                    <small className="text-muted">SKU: {highlightMatch(product.SKU || '', query)}</small>
                                </div>
                                {product.size && product.size.length > 0 && (
                                    <small className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                                        from ₹{Math.min(...product.size.map(s => s.price || 0))}
                                    </small>
                                )}
                            </div>
                            <div className="mt-2 d-flex flex-wrap gap-1">
                                {product.size && product.size.map((s, i) => (
                                    <Badge
                                        key={i}
                                        style={{
                                            fontSize: '11px',
                                            padding: '4px 8px',
                                            fontWeight: 500,
                                            backgroundColor: s.countInStock > 0 ? '#d1e7dd' : '#f8d7da',
                                            color: s.countInStock > 0 ? '#0f5132' : '#842029',
                                            border: `1px solid ${s.countInStock > 0 ? '#badbcc' : '#f5c2c7'}`,
                                        }}
                                    >
                                        {s.size}: {s.countInStock}
                                    </Badge>
                                ))}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </Form.Group>
    );
};

export default ProductPickerComponent;
