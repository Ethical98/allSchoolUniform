import React, { useEffect, useState, useCallback } from 'react';
import { Form, Row, Col, Button, Table, Container, Card, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { logout } from '../actions/userActions';
import {
    createQuotation,
    updateQuotation,
    getQuotationDetails,
    getBillingConfig,
} from '../actions/billingActions';
import {
    QUOTATION_CREATE_RESET,
    QUOTATION_UPDATE_RESET,
    QUOTATION_DETAILS_RESET,
} from '../constants/billingConstants';
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

const QuotationCreateScreen = ({ match, history }) => {
    const quotationId = match.params.id;
    const isEdit = !!quotationId;

    const dispatch = useDispatch();

    const [documentType, setDocumentType] = useState('QUOTATION');
    const [sender, setSender] = useState(null);
    const [buyer, setBuyer] = useState(null);
    const [billType, setBillType] = useState('CGST');
    const [items, setItems] = useState([]);
    const [customItems, setCustomItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [validUntil, setValidUntil] = useState('');

    const quotationCreate = useSelector((state) => state.quotationCreate);
    const { loading: loadingCreate, error: errorCreate, success: successCreate } = quotationCreate || {};

    const quotationUpdate = useSelector((state) => state.quotationUpdate);
    const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = quotationUpdate || {};

    const quotationDetails = useSelector((state) => state.quotationDetails);
    const { loading: loadingDetails, error: errorDetails, quotation } = quotationDetails || {};

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
        } else {
            dispatch(getBillingConfig());
        }
    }, [dispatch, history, userInfo]);

    useEffect(() => {
        if (successCreate || successUpdate) {
            dispatch({ type: QUOTATION_CREATE_RESET });
            dispatch({ type: QUOTATION_UPDATE_RESET });
            dispatch({ type: QUOTATION_DETAILS_RESET });
            history.push('/admin/billing');
        }
    }, [dispatch, history, successCreate, successUpdate]);

    // Cleanup stale Redux state on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: QUOTATION_CREATE_RESET });
            dispatch({ type: QUOTATION_UPDATE_RESET });
            dispatch({ type: QUOTATION_DETAILS_RESET });
        };
    }, [dispatch]);

    useEffect(() => {
        if (isEdit) {
            if (!quotation || quotation._id !== quotationId) {
                dispatch(getQuotationDetails(quotationId));
            } else {
                setDocumentType(quotation.documentType || 'QUOTATION');
                setSender(quotation.sender || null);
                setBuyer(quotation.buyer || null);
                setBillType(quotation.billType || 'CGST');
                setNotes(quotation.notes || '');
                setValidUntil(
                    quotation.validUntil
                        ? new Date(quotation.validUntil).toISOString().split('T')[0]
                        : ''
                );
                // Flatten nested items with variants[] back into flat rows for editing
                const existingItems = [];
                (quotation.items || []).forEach((item) => {
                    (item.variants || []).forEach((variant) => {
                        existingItems.push({
                            productRef: item.product || null,
                            name: item.name,
                            sku: item.sku || '',
                            hsnCode: variant.hsnCode || '',
                            size: variant.size || '',
                            quantity: variant.quantity || 0,
                            unitPrice: variant.unitPrice || 0,
                            discount: variant.discount || 0,
                            taxRate: variant.taxRate || TAX_DEFAULTS.TAX_RATE,
                            isFromProduct: !item.isCustomItem && !!item.product,
                        });
                    });
                });
                setItems(existingItems.filter((i) => i.isFromProduct));
                setCustomItems(existingItems.filter((i) => !i.isFromProduct));
            }
        }
    }, [isEdit, quotation, quotationId, dispatch]);

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
        // eslint-disable-next-line
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
            documentType,
            sender: sender?._id,
            buyer: buyer?._id,
            billType,
            items: allItemsPayload,
            notes,
            validUntil: validUntil || undefined,
        };

        if (isEdit) {
            dispatch(updateQuotation(quotationId, payload));
        } else {
            dispatch(createQuotation(payload));
        }
    };

    return (
        <AdminPageLayout>
            <Meta
                title={`${isEdit ? 'Edit' : 'Create'} Document - AllSchoolUniform`}
                description="Create Quotation / Invoice"
            />
            <Link to="/admin/billing" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container fluid>
                <h1>{isEdit ? 'EDIT DOCUMENT' : 'CREATE DOCUMENT'}</h1>
                {(loadingCreate || loadingUpdate) && <Loader />}
                {errorCreate && <Message variant="danger">{errorCreate}</Message>}
                {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}
                {loadingDetails ? (
                    <Loader />
                ) : errorDetails ? (
                    <Message variant="danger">{errorDetails}</Message>
                ) : (
                    <Form onSubmit={submitHandler}>
                        <Card className="mb-3 p-3">
                            <h5>Document Details</h5>
                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Document Type</Form.Label>
                                        <Form.Select
                                            value={documentType}
                                            onChange={(e) => setDocumentType(e.target.value)}
                                            disabled={isEdit}
                                        >
                                            <option value="QUOTATION">Quotation</option>
                                            <option value="PROFORMA_INVOICE">Proforma Invoice</option>
                                            <option value="TAX_INVOICE">Tax Invoice</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Bill Type (GST)</Form.Label>
                                        <Form.Select
                                            value={billType}
                                            onChange={(e) => setBillType(e.target.value)}
                                        >
                                            <option value="CGST">Intra-State (CGST + SGST)</option>
                                            <option value="IGST">Inter-State (IGST)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Valid Until</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={validUntil}
                                            onChange={(e) => setValidUntil(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card>

                        <Row>
                            <Col md={6}>
                                <Card className="mb-3 p-3">
                                    <h5>Sender (From)</h5>
                                    <CompanySelector
                                        companyType="SENDER"
                                        onSelect={setSender}
                                        selected={sender}
                                        label="Select Sender Company"
                                    />
                                    {sender && (
                                        <div className="small text-muted">
                                            {sender.gstin && <div>GSTIN: {sender.gstin}</div>}
                                            <div>
                                                {sender.city}, {sender.state}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="mb-3 p-3">
                                    <h5>Buyer (To)</h5>
                                    <CompanySelector
                                        companyType="BUYER"
                                        onSelect={setBuyer}
                                        selected={buyer}
                                        label="Select Buyer Company"
                                    />
                                    {buyer && (
                                        <div className="small text-muted">
                                            {buyer.gstin && <div>GSTIN: {buyer.gstin}</div>}
                                            <div>
                                                {buyer.city}, {buyer.state}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        <Card className="mb-3 p-3">
                            <h5>Line Items</h5>
                            <div className="mb-3">
                                <Form.Label>Add Product from Inventory</Form.Label>
                                <ProductPickerComponent onSelect={handleProductSelect} />
                            </div>

                            {items.length > 0 && (
                                <Table responsive bordered hover size="sm" className="mb-3">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Product</th>
                                            {cfgShowHSN && <th>HSN</th>}
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
                                                            bg={item.countInStock > 0 ? 'success' : 'danger'}
                                                            className="ms-1"
                                                        >
                                                            Stock: {item.countInStock}
                                                        </Badge>
                                                    )}
                                                </td>
                                                {cfgShowHSN && <td>{item.hsnCode}</td>}
                                                <td>{item.size}</td>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        value={item.quantity || ''}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'quantity', e.target.value)
                                                        }
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        value={item.unitPrice || ''}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'unitPrice', e.target.value)
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
                                                            handleItemChange(index, 'discount', e.target.value)
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

                            <h6 className="mt-3">Custom Items</h6>
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

                        <Card className="mb-3 p-3">
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Notes / Terms</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Payment terms, delivery notes..."
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Table bordered size="sm">
                                        <tbody>
                                            <tr>
                                                <td>Subtotal (Taxable)</td>
                                                <td className="text-end">
                                                    ₹{' '}
                                                    {subtotal.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    {billType === 'CGST'
                                                        ? 'CGST + SGST'
                                                        : 'IGST'}
                                                </td>
                                                <td className="text-end">
                                                    ₹{' '}
                                                    {totalTax.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                            <tr className="table-dark">
                                                <td>
                                                    <strong>Grand Total</strong>
                                                </td>
                                                <td className="text-end">
                                                    <strong>
                                                        ₹{' '}
                                                        {grandTotal.toLocaleString('en-IN', {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </strong>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>
                        </Card>

                        {zeroQtyCount > 0 && (
                            <Message variant="warning">
                                {zeroQtyCount} item(s) have zero quantity and will be excluded from the document.
                            </Message>
                        )}

                        <Row className="mb-4">
                            <Col className="text-center">
                                <Button
                                    variant="dark"
                                    type="submit"
                                    size="lg"
                                    className="px-5"
                                    disabled={allItems.length === 0 || !sender || !buyer || loadingCreate || loadingUpdate}
                                >
                                    {isEdit ? 'UPDATE DOCUMENT' : 'CREATE DOCUMENT'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                )}
            </Container>
        </AdminPageLayout>
    );
};

export default QuotationCreateScreen;
