import React, { useState } from 'react';
import { Form, Button, Table } from 'react-bootstrap';

const DISPOSITIONS = ['GOOD', 'DAMAGED', 'UNSELLABLE', 'NOT_RECEIVED'];

const QCDispositionForm = ({ items = [], onSubmit }) => {
    const [dispositions, setDispositions] = useState(
        items.map((item) => ({
            itemId: item._id || item.itemId,
            disposition: item.qcDisposition || '',
            notes: item.qcNotes || '',
            acceptedQty: item.acceptedQty ?? item.returnQty ?? 0,
        }))
    );

    const handleDispositionChange = (index, value) => {
        setDispositions((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], disposition: value };
            return updated;
        });
    };

    const handleNotesChange = (index, value) => {
        setDispositions((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], notes: value };
            return updated;
        });
    };

    const handleAcceptedQtyChange = (index, value) => {
        setDispositions((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], acceptedQty: value === '' ? '' : Number(value) };
            return updated;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const allFilled = dispositions.every((d) => d.disposition);
        if (!allFilled) {
            alert('Please select a disposition for every item.');
            return;
        }
        const qtyOk = dispositions.every((d, i) => {
            const max = items[i].returnQty;
            const q = Number(d.acceptedQty);
            return Number.isInteger(q) && q >= 0 && q <= max;
        });
        if (!qtyOk) {
            alert('Accepted qty must be a whole number between 0 and the return qty for every item.');
            return;
        }
        const normalized = dispositions.map((d) => ({
            ...d,
            acceptedQty: Number(d.acceptedQty) || 0,
        }));
        onSubmit(normalized);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Table bordered hover responsive>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Qty</th>
                        <th>Accepted Qty</th>
                        <th>Disposition</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item._id || item.itemId || index}>
                            <td>{item.productName || item.name || '-'}</td>
                            <td>{item.size || '-'}</td>
                            <td>{item.returnQty || 0}</td>
                            <td style={{ maxWidth: 90 }}>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    max={item.returnQty}
                                    value={dispositions[index]?.acceptedQty}
                                    onChange={(e) => handleAcceptedQtyChange(index, e.target.value)}
                                />
                            </td>
                            <td>
                                {DISPOSITIONS.map((d) => (
                                    <Form.Check
                                        key={d}
                                        inline
                                        type="radio"
                                        label={d.replace(/_/g, ' ')}
                                        name={`disposition-${index}`}
                                        value={d}
                                        checked={dispositions[index]?.disposition === d}
                                        onChange={() => handleDispositionChange(index, d)}
                                    />
                                ))}
                            </td>
                            <td>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Optional notes"
                                    value={dispositions[index]?.notes || ''}
                                    onChange={(e) => handleNotesChange(index, e.target.value)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <Button type="submit" variant="primary">
                Submit QC Disposition
            </Button>
        </Form>
    );
};

export default QCDispositionForm;
