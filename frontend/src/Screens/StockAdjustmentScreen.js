import React, { useEffect, useState } from 'react';
import { Form, Button, FloatingLabel, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { adjustStock, getProductStock } from '../actions/stockActions';
import { STOCK_ADJUST_RESET } from '../constants/stockConstants';
import { logout } from '../actions/userActions';
import api from '../utils/api';

const StockAdjustmentScreen = ({ match, history }) => {
    const productId = match.params.productId;

    const dispatch = useDispatch();

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [adjustmentType, setAdjustmentType] = useState('PURCHASE');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [productSizes, setProductSizes] = useState([]);
    const [currentStock, setCurrentStock] = useState(null);
    const [currentCostPrice, setCurrentCostPrice] = useState(null);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const stockAdjust = useSelector((state) => state.stockAdjust);
    const { loading: loadingAdjust, error: errorAdjust, success } = stockAdjust;

    const stockProductDetails = useSelector((state) => state.stockProductDetails);
    const { product: productDetails } = stockProductDetails;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [history, userInfo, dispatch]);

    // If productId is in URL, load that product
    useEffect(() => {
        if (productId) {
            dispatch(getProductStock(productId));
        }
    }, [dispatch, productId]);

    // When product details load from URL param, pre-fill
    useEffect(() => {
        if (productId && productDetails && productDetails._id === productId) {
            setSelectedProduct(productId);
            setSearchTerm(productDetails.name || '');
            setProductSizes(productDetails.size || []);
        }
    }, [productId, productDetails]);

    // Search products for typeahead
    useEffect(() => {
        const searchProducts = async () => {
            if (searchTerm.length < 2) {
                setProducts([]);
                return;
            }
            try {
                const config = {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                };
                const { data } = await api.get(`/api/stock/products/search?search=${searchTerm}`, config);
                setProducts(data || []);
            } catch (err) {
                // Silently handle search errors — user sees empty results
            }
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, userInfo]);

    // Update current stock and costPrice when size is selected
    useEffect(() => {
        if (selectedSize && productSizes.length > 0) {
            const sizeVariant = productSizes.find((s) => s.size === selectedSize);
            setCurrentStock(sizeVariant ? sizeVariant.countInStock : null);
            setCurrentCostPrice(sizeVariant ? sizeVariant.costPrice || null : null);
        } else {
            setCurrentStock(null);
            setCurrentCostPrice(null);
        }
        setCostPrice('');
    }, [selectedSize, productSizes]);

    // On success redirect
    useEffect(() => {
        if (success) {
            dispatch({ type: STOCK_ADJUST_RESET });
            history.push('/admin/stock/overview');
        }
    }, [success, dispatch, history]);

    // Cleanup stale Redux state on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: STOCK_ADJUST_RESET });
        };
    }, [dispatch]);

    const handleProductSelect = (product) => {
        setSelectedProduct(product._id);
        setSearchTerm(product.name);
        setProductSizes(product.size || []);
        setSelectedSize('');
        setProducts([]);
    };

    const submitHandler = (e) => {
        e.preventDefault();
        if (!selectedProduct || !selectedSize || !quantity) return;

        const adjustmentData = {
            productId: selectedProduct,
            size: selectedSize,
            type: adjustmentType,
            quantityChange: parseInt(quantity),
            reason,
            notes
        };
        if (costPrice && ['PURCHASE', 'OPENING_STOCK', 'RETURN'].includes(adjustmentType)) {
            adjustmentData.costPrice = parseFloat(costPrice);
        }
        dispatch(adjustStock(adjustmentData));
    };

    return (
        <AdminPageLayout>
            <Meta title="Adjust Stock - Allschooluniform" />
            <Link to="/admin/stock/overview" className="btn btn-light my-3">
                Go Back
            </Link>
            <h1>ADJUST STOCK</h1>

            {errorAdjust && <Message variant="danger">{errorAdjust}</Message>}
            {loadingAdjust && <Loader />}

            <Form onSubmit={submitHandler}>
                {/* Product Search */}
                <Form.Group className="mb-3" style={{ position: 'relative' }}>
                    <FloatingLabel label="Search Product">
                        <Form.Control
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!e.target.value) {
                                    setSelectedProduct('');
                                    setProductSizes([]);
                                    setSelectedSize('');
                                }
                            }}
                            placeholder="Search by product name or SKU"
                        />
                    </FloatingLabel>
                    {products.length > 0 && !selectedProduct && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                background: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '0 0 4px 4px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}
                        >
                            {products.map((p) => (
                                <div
                                    key={p._id}
                                    onClick={() => handleProductSelect(p)}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #eee'
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = '#f0f0f0')}
                                    onMouseLeave={(e) => (e.target.style.background = 'white')}
                                >
                                    <strong>{p.name}</strong> <span className="text-muted">({p.SKU})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Form.Group>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <FloatingLabel label="Size Variant">
                                <Form.Select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    disabled={productSizes.length === 0}
                                >
                                    <option value="">Select Size</option>
                                    {productSizes.map((s, i) => (
                                        <option key={i} value={s.size}>
                                            {s.size} (Stock: {s.countInStock})
                                        </option>
                                    ))}
                                </Form.Select>
                            </FloatingLabel>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <FloatingLabel label="Adjustment Type">
                                <Form.Select value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)}>
                                    <option value="PURCHASE">Purchase (Add Stock)</option>
                                    <option value="RETURN">Return (Add Stock)</option>
                                    <option value="DAMAGE">Damage (Remove Stock)</option>
                                    <option value="CORRECTION">Correction</option>
                                    <option value="OPENING_STOCK">Opening Stock</option>
                                </Form.Select>
                            </FloatingLabel>
                        </Form.Group>
                    </Col>
                </Row>

                {currentStock !== null && (
                    <Message variant="info">
                        Current stock for size <strong>{selectedSize}</strong>: <strong>{currentStock}</strong>
                        {currentCostPrice ? <> | Cost Price: <strong>₹{currentCostPrice}</strong></> : ''}
                    </Message>
                )}

                <Row>
                    <Col md={['PURCHASE', 'OPENING_STOCK', 'RETURN'].includes(adjustmentType) ? 4 : 6}>
                        <Form.Group className="mb-3">
                            <FloatingLabel label="Quantity">
                                <Form.Control
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                    required
                                />
                            </FloatingLabel>
                        </Form.Group>
                    </Col>
                    <Col md={['PURCHASE', 'OPENING_STOCK', 'RETURN'].includes(adjustmentType) ? 4 : 6}>
                        <Form.Group className="mb-3">
                            <FloatingLabel label="Reason">
                                <Form.Control
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Reason for adjustment"
                                />
                            </FloatingLabel>
                        </Form.Group>
                    </Col>
                    {['PURCHASE', 'OPENING_STOCK', 'RETURN'].includes(adjustmentType) && (
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <FloatingLabel label="Cost Price (₹) - optional">
                                    <Form.Control
                                        type="number"
                                        value={costPrice}
                                        onChange={(e) => setCostPrice(e.target.value)}
                                        placeholder="Purchase cost per unit"
                                        min="0"
                                        step="0.01"
                                    />
                                </FloatingLabel>
                            </Form.Group>
                        </Col>
                    )}
                </Row>

                <Form.Group className="mb-3">
                    <FloatingLabel label="Notes (optional)">
                        <Form.Control
                            as="textarea"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes"
                            style={{ height: '80px' }}
                        />
                    </FloatingLabel>
                </Form.Group>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={!selectedProduct || !selectedSize || !quantity || loadingAdjust}
                >
                    {loadingAdjust ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
            </Form>
        </AdminPageLayout>
    );
};

export default StockAdjustmentScreen;
