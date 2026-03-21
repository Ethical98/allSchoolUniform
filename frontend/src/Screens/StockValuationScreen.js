import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Table, Button, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getStockValuation, getStockValuationFilters } from '../actions/stockActions';
import { logout } from '../actions/userActions';
import { Link } from 'react-router-dom';

const formatCurrency = (val) => `₹ ${(val || 0).toLocaleString('en-IN')}`;

const statCardConfig = [
    { key: 'totalProducts', label: 'Total Products', icon: 'fas fa-boxes', color: '#4e73df' },
    { key: 'totalUnits', label: 'Total Units', icon: 'fas fa-cubes', color: '#6610f2' },
    { key: 'totalRetailValue', label: 'Sell Value', icon: 'fas fa-tag', color: '#36b9cc', isCurrency: true },
    { key: 'totalCostValue', label: 'Cost Value', icon: 'fas fa-money-bill', color: '#858796', isCurrency: true },
    { key: 'potentialProfit', label: 'Potential Profit', icon: 'fas fa-chart-line', color: '#1cc88a', isCurrency: true },
];

const StockValuationScreen = ({ history }) => {
    const dispatch = useDispatch();

    const [school, setSchool] = useState('');
    const [type, setType] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const stockValuation = useSelector((state) => state.stockValuation);
    const { loading, error, valuation } = stockValuation;

    const stockValuationFilters = useSelector((state) => state.stockValuationFilters);
    const { schools = [], types = [] } = stockValuationFilters || {};

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [history, userInfo, dispatch]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(getStockValuationFilters());
        }
    }, [dispatch, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(getStockValuation(school, type));
        }
    }, [dispatch, userInfo, school, type]);

    const handleExportCSV = () => {
        if (!valuation || !valuation.breakdown) return;

        const rows = [['Product', 'SKU', 'Type', 'Size', 'Qty', 'Sell Price', 'Cost Price', 'Sell Value', 'Cost Value', 'Profit']];

        valuation.breakdown.forEach((p) => {
            p.variants.forEach((v) => {
                rows.push([
                    p.name, p.SKU, p.type, v.size,
                    v.qty, v.price, v.costPrice,
                    v.value, v.costValue,
                    v.value - v.costValue,
                ]);
            });
        });

        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-valuation-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClearFilters = () => {
        setSchool('');
        setType('');
    };

    const summary = valuation?.valuation;
    const summaryWithProfit = summary
        ? { ...summary, potentialProfit: (summary.totalRetailValue || 0) - (summary.totalCostValue || 0) }
        : null;

    // Calculate totals for the breakdown table
    const totals = valuation?.breakdown
        ? valuation.breakdown.reduce(
              (acc, product) => {
                  product.variants.forEach((v) => {
                      acc.qty += v.qty || 0;
                      acc.sellValue += v.value || 0;
                      acc.costValue += v.costValue || 0;
                  });
                  return acc;
              },
              { qty: 0, sellValue: 0, costValue: 0 }
          )
        : null;

    return (
        <AdminPageLayout>
            <Meta title="Stock Valuation - AllSchoolUniform" />

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>STOCK VALUATION</h1>
                <div>
                    <Button variant="outline-success" className="me-2" onClick={handleExportCSV} disabled={!valuation}>
                        <i className="fas fa-file-csv me-1"></i> Export CSV
                    </Button>
                    <Link to="/admin/stock" className="btn btn-outline-dark">
                        <i className="fas fa-arrow-left me-1"></i> Dashboard
                    </Link>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="shadow-sm mb-4">
                <Card.Body className="py-3">
                    <div className="d-flex align-items-center gap-3">
                        <i className="fas fa-filter text-muted"></i>
                        <Form.Select
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            style={{ maxWidth: '280px' }}
                        >
                            <option value="">All Schools</option>
                            {schools.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </Form.Select>
                        <Form.Select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={{ maxWidth: '220px' }}
                        >
                            <option value="">All Types</option>
                            {types.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </Form.Select>
                        {(school || type) && (
                            <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                                <i className="fas fa-times me-1"></i> Clear
                            </Button>
                        )}
                        {(school || type) && (
                            <small className="text-muted ms-auto">
                                Filtered: {[school, type].filter(Boolean).join(', ')}
                            </small>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : valuation ? (
                <>
                    {/* Summary Cards */}
                    {summaryWithProfit && (
                        <Row className="mb-4 g-3">
                            {statCardConfig.map((card) => (
                                <Col key={card.key} xl md={4} sm={6}>
                                    <Card
                                        className="h-100 shadow-sm"
                                        style={{ borderLeft: `4px solid ${card.color}` }}
                                    >
                                        <Card.Body className="d-flex align-items-center py-3">
                                            <div className="flex-grow-1">
                                                <div className="text-uppercase text-muted small fw-bold mb-1">
                                                    {card.label}
                                                </div>
                                                <div className="h4 mb-0 fw-bold" style={{ color: card.color }}>
                                                    {card.isCurrency
                                                        ? formatCurrency(summaryWithProfit[card.key])
                                                        : (summaryWithProfit[card.key] || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            <div>
                                                <i
                                                    className={card.icon}
                                                    style={{ fontSize: '2rem', color: card.color, opacity: 0.3 }}
                                                ></i>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {/* Breakdown Table */}
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-table me-2 text-primary"></i>
                                    Product Breakdown
                                </h5>
                                <Badge bg="secondary" style={{ fontSize: '13px' }}>
                                    {valuation.breakdown?.length || 0} products
                                </Badge>
                            </div>

                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                <Table bordered hover responsive size="sm" className="mb-0">
                                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>SKU</th>
                                            <th>Type</th>
                                            <th>Size</th>
                                            <th className="text-end">Qty</th>
                                            <th className="text-end">Sell Price</th>
                                            <th className="text-end">Cost Price</th>
                                            <th className="text-end">Sell Value</th>
                                            <th className="text-end">Cost Value</th>
                                            <th className="text-end">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {valuation.breakdown && valuation.breakdown.map((product, pIdx) =>
                                            product.variants.map((v, vIdx) => (
                                                <tr key={`${product.productId}-${v.size}`}>
                                                    {vIdx === 0 && (
                                                        <td rowSpan={product.variants.length} className="align-middle">
                                                            {pIdx + 1}
                                                        </td>
                                                    )}
                                                    {vIdx === 0 && (
                                                        <td rowSpan={product.variants.length} className="align-middle">
                                                            <Link
                                                                to={`/admin/stock/product/${product.productId}`}
                                                                style={{ textDecoration: 'none' }}
                                                            >
                                                                <div style={{ fontWeight: 500 }}>{product.name}</div>
                                                            </Link>
                                                        </td>
                                                    )}
                                                    {vIdx === 0 && (
                                                        <td rowSpan={product.variants.length} className="align-middle">
                                                            <small className="text-muted">{product.SKU}</small>
                                                        </td>
                                                    )}
                                                    {vIdx === 0 && (
                                                        <td rowSpan={product.variants.length} className="align-middle">
                                                            <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>
                                                                {product.type}
                                                            </Badge>
                                                        </td>
                                                    )}
                                                    <td>
                                                        <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>
                                                            {v.size}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end">
                                                        <span style={{ color: v.qty <= 0 ? '#e74a3b' : '#1cc88a', fontWeight: 600 }}>
                                                            {v.qty}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">₹{(v.price || 0).toLocaleString('en-IN')}</td>
                                                    <td className="text-end">₹{(v.costPrice || 0).toLocaleString('en-IN')}</td>
                                                    <td className="text-end">₹{(v.value || 0).toLocaleString('en-IN')}</td>
                                                    <td className="text-end">₹{(v.costValue || 0).toLocaleString('en-IN')}</td>
                                                    <td className="text-end">
                                                        <span style={{ color: (v.value - v.costValue) >= 0 ? '#1cc88a' : '#e74a3b', fontWeight: 600 }}>
                                                            ₹{((v.value || 0) - (v.costValue || 0)).toLocaleString('en-IN')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {totals && (
                                        <tfoot className="table-light" style={{ fontWeight: 700 }}>
                                            <tr>
                                                <td colSpan={5} className="text-end">TOTALS</td>
                                                <td className="text-end">{totals.qty.toLocaleString('en-IN')}</td>
                                                <td></td>
                                                <td></td>
                                                <td className="text-end">{formatCurrency(totals.sellValue)}</td>
                                                <td className="text-end">{formatCurrency(totals.costValue)}</td>
                                                <td className="text-end" style={{ color: '#1cc88a' }}>
                                                    {formatCurrency(totals.sellValue - totals.costValue)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </>
            ) : null}
        </AdminPageLayout>
    );
};

export default StockValuationScreen;
