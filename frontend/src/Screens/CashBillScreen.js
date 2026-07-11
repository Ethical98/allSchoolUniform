import React, { useEffect, useState, useCallback } from 'react';
import { Form, Row, Col, Button, Table, Container, Card, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { logout } from '../actions/userActions';
import { createCashBill, getBillingConfig } from '../actions/billingActions';
import { CASH_BILL_CREATE_RESET } from '../constants/billingConstants';
import CompanySelector from '../components/billing/CompanySelector';
import ProductPickerComponent from '../components/billing/ProductPickerComponent';
import CustomItemRow from '../components/billing/CustomItemRow';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import { calculateLineTotal, calculateDocumentTotals, TAX_DEFAULTS } from '../utils/taxCalculator';

const emptyItem = () => ({
    name: '',
    hsnCode: '',
    size: '',
    quantity: 0,
    unitPrice: 0,
    discount: 0,
    taxRate: TAX_DEFAULTS.TAX_RATE,
});

const CashBillScreen = ({ history }) => {
    const dispatch = useDispatch();

    const [sender, setSender] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [billType, setBillType] = useState('CGST');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentRef, setPaymentRef] = useState('');
    const [items, setItems] = useState([]);
    const [customItems, setCustomItems] = useState([]);
    const [notes, setNotes] = useState('');

    const cashBillCreate = useSelector((state) => state.cashBillCreate);
    const { loading, error, success, bill } = cashBillCreate || {};

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const billingConfig = useSelector((state) => state.billingConfig);
    const { config: billingCfg } = billingConfig;
    const cfgShowHSN = billingCfg?.showHSN ?? true;
    const cfgTaxEnabled = billingCfg?.taxEnabled ?? true;
    const cfgDefaultTaxRate = billingCfg?.defaultTaxRate ?? TAX_DEFAULTS.TAX_RATE;
    const cfgDefaultHSNCode = billingCfg?.defaultHSNCode ?? TAX_DEFAULTS.HSN_CODE;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [dispatch, history, userInfo]);

    useEffect(() => {
        dispatch(getBillingConfig());
    }, [dispatch]);

    useEffect(() => {
        if (success && bill && bill._id) {
            dispatch({ type: CASH_BILL_CREATE_RESET });
            history.push(`/admin/billing/quotation/${bill._id}/view`);
        } else if (success) {
            dispatch({ type: CASH_BILL_CREATE_RESET });
            history.push('/admin/billing');
        }
    }, [dispatch, history, success, bill]);

    // Cleanup stale Redux state on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: CASH_BILL_CREATE_RESET });
        };
    }, [dispatch]);

    const handleProductSelect = useCallback((product) => {
        if (!product) return;
        const newItems = (product.size || []).map((s) => ({
            productRef: product._id,
            name: product.name,
            hsnCode: product.hsnCode || cfgDefaultHSNCode,
            size: s.size,
            quantity: 0,
            unitPrice: s.price || 0,
            discount: s.discount || 0,
            taxRate: cfgTaxEnabled ? (s.tax || cfgDefaultTaxRate) : 0,
            countInStock: s.countInStock || 0,
            isFromProduct: true,
        }));
        setItems((prev) => [...prev, ...newItems]);
    }, [cfgDefaultHSNCode, cfgDefaultTaxRate, cfgTaxEnabled]);

    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index] };
            if (['quantity', 'unitPrice', 'discount', 'taxRate'].includes(field)) {
                updated[index][field] = parseFloat(value) || 0;
            } else {
                updated[index][field] = value;
            }
            return updated;
        });
    };

    const handleRemoveItem = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCustomItemChange = (index, updatedItem) => {
        setCustomItems((prev) => {
            const updated = [...prev];
            updated[index] = updatedItem;
            return updated;
        });
    };

    const handleRemoveCustomItem = (index) => {
        setCustomItems((prev) => prev.filter((_, i) => i !== index));
    };

    const allItems = [...items, ...customItems].filter((i) => i.quantity > 0);
    const zeroQtyCount = [...items, ...customItems].filter((i) => i.name && i.quantity <= 0).length;

    const getLineTotal = (item) => {
        const line = calculateLineTotal(item.quantity, item.unitPrice, item.discount, item.taxRate, billType);
        return line.totalAmount;
    };

    const docTotals = calculateDocumentTotals(allItems, billType);
    const { subtotal, totalTax, grandTotal } = docTotals;

    const submitHandler = (e) => {
        e.preventDefault();
        const allItemsPayload = [
            ...items.map((i) => ({
                productRef: i.productRef,
                name: i.name,
                hsnCode: i.hsnCode,
                size: i.size,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discount,
                taxRate: i.taxRate,
            })),
            ...customItems.map((i) => ({
                name: i.name,
                hsnCode: i.hsnCode,
                size: i.size,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discount,
                taxRate: i.taxRate,
            })),
        ].filter((i) => i.quantity > 0);

        const payload = {
            sender: sender?._id,
            walkInCustomer: {
                name: customerName || 'Walk-in Customer',
                phone: customerPhone,
            },
            billType,
            paymentMode,
            paymentRef,
            items: allItemsPayload,
            notes,
        };

        dispatch(createCashBill(payload));
    };

    const handleReset = () => {
        setCustomerName('');
        setCustomerPhone('');
        setItems([]);
        setCustomItems([]);
        setNotes('');
        setPaymentMode('CASH');
        setPaymentRef('');
    };

    return (
        <AdminPageLayout>
            <Meta title="Cash Bill - AllSchoolUniform" description="POS Quick Bill" />
            <Link to="/admin/billing" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container fluid>
                <Row className="align-items-center mb-3">
                    <Col>
                        <h1>
                            <i className="fas fa-cash-register me-2"></i>CASH BILL
                        </h1>
                    </Col>
                    <Col className="text-end">
                        <Button variant="outline-secondary" onClick={handleReset}>
                            <i className="fas fa-redo" /> Reset
                        </Button>
                    </Col>
                </Row>

                {loading && <Loader />}
                {error && <Message variant="danger">{error}</Message>}

                <Form onSubmit={submitHandler}>
                    <Row>
                        <Col md={8}>
                            <Card className="mb-3 p-3">
                                <h5>Customer (Optional)</h5>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Customer Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Walk-in Customer"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Phone</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                placeholder="Phone number"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card>

                            <Card className="mb-3 p-3">
                                <h5>Items</h5>
                                <div className="mb-3">
                                    <ProductPickerComponent onSelect={handleProductSelect} />
                                </div>

                                {items.length > 0 && (
                                    <Table responsive bordered hover size="sm" className="mb-3">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Product</th>
                                                <th>Size</th>
                                                <th style={{ width: '80px' }}>Qty</th>
                                                <th style={{ width: '100px' }}>Price</th>
                                                <th style={{ width: '70px' }}>Disc %</th>
                                                {cfgTaxEnabled && <th style={{ width: '70px' }}>Tax %</th>}
                                                <th>Amount</th>
                                                <th style={{ width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        {item.name}
                                                        {item.countInStock !== undefined && (
                                                            <Badge
                                                                bg={
                                                                    item.countInStock > 0
                                                                        ? 'success'
                                                                        : 'danger'
                                                                }
                                                                className="ms-1"
                                                            >
                                                                {item.countInStock}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td>{item.size}</td>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            value={item.quantity || ''}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    'quantity',
                                                                    e.target.value
                                                                )
                                                            }
                                                            min="0"
                                                            max={item.countInStock || 99999}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            value={item.unitPrice || ''}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    'unitPrice',
                                                                    e.target.value
                                                                )
                                                            }
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            value={item.discount || ''}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    'discount',
                                                                    e.target.value
                                                                )
                                                            }
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </td>
                                                    {cfgTaxEnabled && (
                                                    <td>
                                                        <Form.Select
                                                            size="sm"
                                                            value={(billingCfg?.standardTaxRates || TAX_DEFAULTS.STANDARD_TAX_RATES).includes(Number(item.taxRate)) ? item.taxRate : 'custom'}
                                                            onChange={(e) => {
                                                                if (e.target.value === 'custom') {
                                                                    handleItemChange(index, 'taxRate', item.taxRate || 0);
                                                                } else {
                                                                    handleItemChange(index, 'taxRate', e.target.value);
                                                                }
                                                            }}
                                                        >
                                                            {(billingCfg?.standardTaxRates || TAX_DEFAULTS.STANDARD_TAX_RATES).map((r) => (
                                                                <option key={r} value={r}>{r}%</option>
                                                            ))}
                                                            <option value="custom">Custom</option>
                                                        </Form.Select>
                                                        {!(billingCfg?.standardTaxRates || TAX_DEFAULTS.STANDARD_TAX_RATES).includes(Number(item.taxRate)) && (
                                                            <Form.Control
                                                                size="sm"
                                                                type="number"
                                                                className="mt-1"
                                                                value={item.taxRate}
                                                                onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                placeholder="Tax %"
                                                            />
                                                        )}
                                                    </td>
                                                    )}
                                                    <td className="text-end">
                                                        ₹ {getLineTotal(item).toFixed(2)}
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}

                                <h6>Custom Items</h6>
                                {customItems.map((item, index) => (
                                    <CustomItemRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        onChange={handleCustomItemChange}
                                        onRemove={handleRemoveCustomItem}
                                        billType={billType}
                                        billingConfig={billingCfg}
                                    />
                                ))}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setCustomItems((prev) => [...prev, emptyItem()])}
                                >
                                    <i className="fas fa-plus" /> Add Custom Item
                                </Button>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="mb-3 p-3" style={{ position: 'sticky', top: '10px' }}>
                                <h5>Bill Summary</h5>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small">Sender Company</Form.Label>
                                    <CompanySelector
                                        companyType="SENDER"
                                        onSelect={setSender}
                                        selected={sender}
                                        label=""
                                    />
                                </Form.Group>

                                <Row>
                                    <Col>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small">GST Type</Form.Label>
                                            <Form.Select
                                                size="sm"
                                                value={billType}
                                                onChange={(e) => setBillType(e.target.value)}
                                            >
                                                <option value="CGST">CGST+SGST</option>
                                                <option value="IGST">IGST</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small">Payment</Form.Label>
                                            <Form.Select
                                                size="sm"
                                                value={paymentMode}
                                                onChange={(e) => setPaymentMode(e.target.value)}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CARD">Card</option>
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {paymentMode !== 'CASH' && (
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small">
                                            {paymentMode === 'UPI'
                                                ? 'UPI Transaction ID / UPI ID'
                                                : paymentMode === 'CARD'
                                                ? 'Card Last 4 Digits / Approval Code'
                                                : 'Transaction Reference No.'}
                                        </Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="text"
                                            value={paymentRef}
                                            onChange={(e) => setPaymentRef(e.target.value)}
                                            placeholder={
                                                paymentMode === 'UPI'
                                                    ? 'e.g. 432109876543 or name@upi'
                                                    : paymentMode === 'CARD'
                                                    ? 'e.g. XX1234 / Auth: 567890'
                                                    : 'e.g. NEFT ref number'
                                            }
                                        />
                                    </Form.Group>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label className="small">Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        size="sm"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Additional notes..."
                                    />
                                </Form.Group>

                                <hr />

                                <Table size="sm" borderless>
                                    <tbody>
                                        <tr>
                                            <td>Items</td>
                                            <td className="text-end">{allItems.length}</td>
                                        </tr>
                                        <tr>
                                            <td>Subtotal</td>
                                            <td className="text-end">
                                                ₹{' '}
                                                {subtotal.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>{billType === 'CGST' ? 'CGST+SGST' : 'IGST'}</td>
                                            <td className="text-end">
                                                ₹{' '}
                                                {totalTax.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                        <tr style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                                            <td>TOTAL</td>
                                            <td className="text-end">
                                                ₹{' '}
                                                {grandTotal.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>

                                {zeroQtyCount > 0 && (
                                    <p className="text-warning small mb-1">
                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                        {zeroQtyCount} item(s) with zero qty will be excluded.
                                    </p>
                                )}

                                <Button
                                    variant="success"
                                    type="submit"
                                    size="lg"
                                    className="w-100 mt-2"
                                    disabled={allItems.length === 0 || !sender || loading}
                                >
                                    <i className="fas fa-check-circle me-2"></i>
                                    GENERATE BILL
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Container>
        </AdminPageLayout>
    );
};

export default CashBillScreen;
