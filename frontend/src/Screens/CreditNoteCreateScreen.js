import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, Table, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { getQuotationDetails, createCreditNote, createDebitNote } from '../actions/billingActions';
import { CREDIT_NOTE_CREATE_RESET, DEBIT_NOTE_CREATE_RESET } from '../constants/billingConstants';
import { calculateLineTotal, calculateDocumentTotals } from '../utils/taxCalculator';
import { logout } from '../actions/userActions';

const CreditNoteCreateScreen = ({ match, history }) => {
    const invoiceId = match.params.invoiceId;
    const isDebitNote = match.path.includes('debit-note');
    const noteType = isDebitNote ? 'Debit Note' : 'Credit Note';

    const dispatch = useDispatch();

    const [reason, setReason] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const quotationDetails = useSelector((state) => state.quotationDetails);
    const { loading, error, quotation: invoice } = quotationDetails;

    const creditNoteCreate = useSelector((state) => state.creditNoteCreate);
    const { loading: loadingCreate, error: errorCreate, success: successCreate } = creditNoteCreate;

    const debitNoteCreate = useSelector((state) => state.debitNoteCreate);
    const { loading: loadingDebit, error: errorDebit, success: successDebit } = debitNoteCreate;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [history, userInfo, dispatch]);

    useEffect(() => {
        dispatch(getQuotationDetails(invoiceId));
    }, [dispatch, invoiceId]);

    // Pre-fill items from invoice once loaded
    useEffect(() => {
        if (invoice && invoice._id === invoiceId && invoice.items && selectedItems.length === 0) {
            const flatItems = [];
            invoice.items.forEach((item) => {
                if (item.variants) {
                    item.variants.forEach((variant) => {
                        flatItems.push({
                            productRef: item.product || null,
                            name: item.name,
                            hsnCode: variant.hsnCode || '',
                            size: variant.size || '',
                            maxQuantity: variant.quantity,
                            quantity: variant.quantity,
                            unitPrice: variant.unitPrice,
                            discount: variant.discount || 0,
                            taxRate: variant.taxRate || 0,
                            included: true,
                        });
                    });
                }
            });
            setSelectedItems(flatItems);
        }
    }, [invoice, invoiceId, selectedItems.length]);

    useEffect(() => {
        if (successCreate) {
            dispatch({ type: CREDIT_NOTE_CREATE_RESET });
            history.push('/admin/billing');
        }
    }, [successCreate, dispatch, history]);

    useEffect(() => {
        if (successDebit) {
            dispatch({ type: DEBIT_NOTE_CREATE_RESET });
            history.push('/admin/billing');
        }
    }, [successDebit, dispatch, history]);

    // Cleanup stale Redux state on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: CREDIT_NOTE_CREATE_RESET });
            dispatch({ type: DEBIT_NOTE_CREATE_RESET });
        };
    }, [dispatch]);

    const toggleItem = (index) => {
        const updated = [...selectedItems];
        updated[index] = { ...updated[index], included: !updated[index].included };
        setSelectedItems(updated);
    };

    const updateQuantity = (index, qty) => {
        const updated = [...selectedItems];
        const maxQty = updated[index].maxQuantity;
        const val = Math.max(0, Math.min(Number(qty), maxQty));
        updated[index] = { ...updated[index], quantity: val };
        setSelectedItems(updated);
    };

    const getIncludedItems = () => selectedItems.filter((i) => i.included && i.quantity > 0);

    const totals = (() => {
        const included = getIncludedItems();
        if (included.length === 0) return null;
        const forCalc = included.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            taxRate: i.taxRate,
        }));
        return calculateDocumentTotals(forCalc, invoice?.billType || 'CGST');
    })();

    const handleSubmit = (e) => {
        e.preventDefault();
        const items = getIncludedItems().map((i) => ({
            productRef: i.productRef,
            name: i.name,
            hsnCode: i.hsnCode,
            size: i.size,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            taxRate: i.taxRate,
        }));

        if (items.length === 0) {
            alert('Please select at least one item');
            return;
        }

        const noteData = { invoiceId, items, reason };

        if (isDebitNote) {
            dispatch(createDebitNote(noteData));
        } else {
            dispatch(createCreditNote(noteData));
        }
    };

    const isIGST = invoice?.billType === 'IGST';

    return (
        <AdminPageLayout>
            <Meta title={`Create ${noteType} - AllSchoolUniform`} />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Create {noteType}</h4>
                <Link to={`/admin/billing/quotation/${invoiceId}/view`} className="btn btn-outline-dark">
                    <i className="fas fa-arrow-left me-1"></i> Back to Invoice
                </Link>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : invoice ? (
                <Form onSubmit={handleSubmit}>
                    {errorCreate && <Message variant="danger">{errorCreate}</Message>}
                    {errorDebit && <Message variant="danger">{errorDebit}</Message>}

                    {/* Invoice Reference */}
                    <Card className="mb-3">
                        <Card.Body className="py-2">
                            <Row>
                                <Col md={4}>
                                    <strong>Against Invoice:</strong> {invoice.documentNumber}
                                </Col>
                                <Col md={4}>
                                    <strong>Document Type:</strong>{' '}
                                    {invoice.documentType?.replace(/_/g, ' ')}
                                </Col>
                                <Col md={4}>
                                    <strong>Grand Total:</strong>{' '}
                                    ₹{invoice.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Col>
                            </Row>
                            <Row className="mt-2">
                                <Col md={4}>
                                    <strong>Buyer:</strong>{' '}
                                    {invoice.buyer?.name || invoice.walkInCustomer?.name || '-'}
                                </Col>
                                <Col md={4}>
                                    <strong>Bill Type:</strong> {invoice.billType}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Reason */}
                    <Form.Group className="mb-3">
                        <Form.Label>Reason for {noteType} *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={`e.g., Goods returned, Price correction, Quantity adjustment...`}
                            required
                        />
                    </Form.Group>

                    {/* Items Selection */}
                    <h5 className="mt-4 mb-2">Select Items</h5>
                    <p className="text-muted small">
                        Check items to include in the {noteType.toLowerCase()}. Adjust quantities if needed.
                    </p>

                    <Table bordered hover responsive size="sm">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: 40 }}>
                                    <i className="fas fa-check"></i>
                                </th>
                                <th>Item</th>
                                <th>HSN</th>
                                <th>Size</th>
                                <th style={{ width: 100 }}>Qty (max)</th>
                                <th>Rate</th>
                                <th>Disc%</th>
                                <th>Taxable</th>
                                {isIGST ? <th>IGST</th> : <><th>CGST</th><th>SGST</th></>}
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map((item, idx) => {
                                const line = item.included && item.quantity > 0
                                    ? calculateLineTotal(
                                          item.quantity,
                                          item.unitPrice,
                                          item.discount,
                                          item.taxRate,
                                          invoice?.billType || 'CGST'
                                      )
                                    : null;

                                return (
                                    <tr key={idx} className={!item.included ? 'text-muted' : ''}>
                                        <td className="text-center">
                                            <Form.Check
                                                type="checkbox"
                                                checked={item.included}
                                                onChange={() => toggleItem(idx)}
                                            />
                                        </td>
                                        <td>{item.name}</td>
                                        <td>{item.hsnCode}</td>
                                        <td>{item.size}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                value={item.quantity}
                                                min={0}
                                                max={item.maxQuantity}
                                                onChange={(e) => updateQuantity(idx, e.target.value)}
                                                disabled={!item.included}
                                                style={{ width: 80 }}
                                            />
                                            <small className="text-muted">/{item.maxQuantity}</small>
                                        </td>
                                        <td>₹{item.unitPrice}</td>
                                        <td>{item.discount}%</td>
                                        <td>{line ? `₹${line.taxableAmount.toFixed(2)}` : '-'}</td>
                                        {isIGST ? (
                                            <td>{line ? `₹${line.igst.toFixed(2)}` : '-'}</td>
                                        ) : (
                                            <>
                                                <td>{line ? `₹${line.cgst.toFixed(2)}` : '-'}</td>
                                                <td>{line ? `₹${line.sgst.toFixed(2)}` : '-'}</td>
                                            </>
                                        )}
                                        <td>{line ? `₹${line.totalAmount.toFixed(2)}` : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    {/* Totals */}
                    {totals && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Row>
                                    <Col md={{ span: 5, offset: 7 }}>
                                        <Table size="sm" borderless>
                                            <tbody>
                                                <tr>
                                                    <td>Subtotal:</td>
                                                    <td className="text-end">
                                                        ₹{totals.subtotal.toFixed(2)}
                                                    </td>
                                                </tr>
                                                {totals.totalDiscount > 0 && (
                                                    <tr>
                                                        <td>Discount:</td>
                                                        <td className="text-end">
                                                            -₹{totals.totalDiscount.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td>Taxable Amount:</td>
                                                    <td className="text-end">
                                                        ₹{totals.totalTaxableAmount.toFixed(2)}
                                                    </td>
                                                </tr>
                                                {isIGST ? (
                                                    <tr>
                                                        <td>IGST:</td>
                                                        <td className="text-end">
                                                            ₹{totals.totalIGST.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <>
                                                        <tr>
                                                            <td>CGST:</td>
                                                            <td className="text-end">
                                                                ₹{totals.totalCGST.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>SGST:</td>
                                                            <td className="text-end">
                                                                ₹{totals.totalSGST.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}
                                                <tr className="fw-bold border-top">
                                                    <td>Grand Total:</td>
                                                    <td className="text-end">
                                                        ₹{totals.grandTotal.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Submit */}
                    <div className="d-flex gap-2">
                        <Button
                            type="submit"
                            variant={isDebitNote ? 'warning' : 'primary'}
                            disabled={loadingCreate || loadingDebit || getIncludedItems().length === 0}
                        >
                            {(loadingCreate || loadingDebit) ? 'Creating...' : `Create ${noteType}`}
                        </Button>
                        <Link to={`/admin/billing/quotation/${invoiceId}/view`} className="btn btn-outline-secondary">
                            Cancel
                        </Link>
                    </div>
                </Form>
            ) : null}
        </AdminPageLayout>
    );
};

export default CreditNoteCreateScreen;
