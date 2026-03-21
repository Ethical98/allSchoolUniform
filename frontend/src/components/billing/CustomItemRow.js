import React from 'react';
import { Form, Button, Col, Row } from 'react-bootstrap';
import { calculateLineTotal, TAX_DEFAULTS } from '../../utils/taxCalculator';

const CustomItemRow = ({ item, index, onChange, onRemove, billType = 'CGST', billingConfig }) => {
    const showHSN = billingConfig?.showHSN ?? true;
    const taxEnabled = billingConfig?.taxEnabled ?? true;
    const standardRates = billingConfig?.standardTaxRates || TAX_DEFAULTS.STANDARD_TAX_RATES;

    const handleChange = (field, value) => {
        const updated = { ...item };
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'taxRate') {
            updated[field] = parseFloat(value) || 0;
        } else {
            updated[field] = value;
        }
        onChange(index, updated);
    };

    const line = calculateLineTotal(item.quantity, item.unitPrice, item.discount, item.taxRate, billType);
    const lineTotal = line.totalAmount;

    return (
        <Row className="align-items-end mb-2 p-2" style={{ background: '#f8f9fa', borderRadius: '4px' }}>
            <Col md={3}>
                <Form.Group>
                    <Form.Label className="small">Item Name</Form.Label>
                    <Form.Control
                        size="sm"
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Item name"
                    />
                </Form.Group>
            </Col>
            {showHSN && (
            <Col md={1}>
                <Form.Group>
                    <Form.Label className="small">HSN</Form.Label>
                    <Form.Control
                        size="sm"
                        type="text"
                        value={item.hsnCode || ''}
                        onChange={(e) => handleChange('hsnCode', e.target.value)}
                        placeholder="HSN"
                    />
                </Form.Group>
            </Col>
            )}
            <Col md={1}>
                <Form.Group>
                    <Form.Label className="small">Size</Form.Label>
                    <Form.Control
                        size="sm"
                        type="text"
                        value={item.size || ''}
                        onChange={(e) => handleChange('size', e.target.value)}
                        placeholder="Size"
                    />
                </Form.Group>
            </Col>
            <Col md={1}>
                <Form.Group>
                    <Form.Label className="small">Qty</Form.Label>
                    <Form.Control
                        size="sm"
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleChange('quantity', e.target.value)}
                        min="1"
                    />
                </Form.Group>
            </Col>
            <Col md={1}>
                <Form.Group>
                    <Form.Label className="small">Price</Form.Label>
                    <Form.Control
                        size="sm"
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleChange('unitPrice', e.target.value)}
                        min="0"
                    />
                </Form.Group>
            </Col>
            <Col md={1}>
                <Form.Group>
                    <Form.Label className="small">Disc %</Form.Label>
                    <Form.Control
                        size="sm"
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => handleChange('discount', e.target.value)}
                        min="0"
                        max="100"
                    />
                </Form.Group>
            </Col>
            {taxEnabled && (
            <Col md={1}>
                <Form.Group>
                    <Form.Label className="small">Tax %</Form.Label>
                    <Form.Select
                        size="sm"
                        value={standardRates.includes(Number(item.taxRate)) ? item.taxRate : 'custom'}
                        onChange={(e) => {
                            if (e.target.value !== 'custom') {
                                handleChange('taxRate', e.target.value);
                            }
                        }}
                    >
                        {standardRates.map((r) => (
                            <option key={r} value={r}>{r}%</option>
                        ))}
                        <option value="custom">Custom</option>
                    </Form.Select>
                    {!standardRates.includes(Number(item.taxRate)) && (
                        <Form.Control
                            size="sm"
                            type="number"
                            className="mt-1"
                            value={item.taxRate}
                            onChange={(e) => handleChange('taxRate', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="%"
                        />
                    )}
                </Form.Group>
            </Col>
            )}
            <Col md={1}>
                <Form.Group>
                    <Form.Label className="small">Amount</Form.Label>
                    <Form.Control
                        size="sm"
                        type="text"
                        value={`₹ ${lineTotal.toFixed(2)}`}
                        readOnly
                        style={{ background: '#e9ecef' }}
                    />
                </Form.Group>
            </Col>
            <Col md={1} className="text-center">
                <Button variant="outline-danger" size="sm" onClick={() => onRemove(index)}>
                    <i className="fas fa-trash"></i>
                </Button>
            </Col>
        </Row>
    );
};

export default CustomItemRow;
