import React, { useState } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';
import DocumentPrintTemplate from '../components/billing/DocumentPrintTemplate';

const MOCK_TAX_INVOICE = {
    _id: 'test123',
    documentNumber: 'INV-2526-00042',
    documentType: 'TAX_INVOICE',
    status: 'ACCEPTED',
    billType: 'CGST',
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    placeOfSupply: 'Maharashtra',

    sender: {
        name: 'AllSchoolUniform',
        address: 'Shop No 5, Gala Market, Near Station Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        gstin: '27AABCU9603R1ZM',
        pan: 'AABCU9603R',
        phone: '9876543210',
        email: 'billing@allschooluniform.com',
        bankName: 'HDFC Bank',
        accountNumber: '50100123456789',
        ifscCode: 'HDFC0001234',
        branchName: 'Fort Branch, Mumbai',
        upiId: 'allschooluniform@hdfcbank',
    },

    buyer: {
        name: 'St. Xavier\'s High School',
        address: '15 Mahatma Gandhi Road, Dhobi Talao',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        gstin: '27AADCS1234F1Z5',
        contactPerson: 'Fr. Thomas D\'Souza',
        phone: '9123456789',
        email: 'admin@stxaviers.edu.in',
    },

    // Prices are TAX-INCLUSIVE (MRP). Tax is reverse-calculated.
    // e.g. ₹350 at 5% → taxable = 350/1.05 = 333.33, tax = 16.67
    items: [
        {
            name: 'Boys White Shirt - Half Sleeve',
            sku: 'SXV-SHIRT-WH-HS',
            isCustomItem: false,
            variants: [
                // 50×350=17500, disc 10%=1750, after=15750, taxable=15750/1.05=15000, cgst/sgst=375 each
                { size: '24', quantity: 50, unitPrice: 350, discount: 10, taxRate: 5, hsnCode: '6205', taxableAmount: 15000, cgst: 375, sgst: 375, igst: 0, totalAmount: 15750 },
                // 40×370=14800, disc 10%=1480, after=13320, taxable=13320/1.05=12685.71, cgst/sgst=317.14
                { size: '26', quantity: 40, unitPrice: 370, discount: 10, taxRate: 5, hsnCode: '6205', taxableAmount: 12685.71, cgst: 317.14, sgst: 317.14, igst: 0, totalAmount: 13320 },
                // 35×390=13650, disc 10%=1365, after=12285, taxable=12285/1.05=11700, cgst/sgst=292.50
                { size: '28', quantity: 35, unitPrice: 390, discount: 10, taxRate: 5, hsnCode: '6205', taxableAmount: 11700, cgst: 292.50, sgst: 292.50, igst: 0, totalAmount: 12285 },
            ],
        },
        {
            name: 'Boys Navy Blue Trouser',
            sku: 'SXV-TROU-NB',
            isCustomItem: false,
            variants: [
                // 50×450=22500, disc 5%=1125, after=21375, taxable=21375/1.05=20357.14, cgst/sgst=508.93
                { size: '24', quantity: 50, unitPrice: 450, discount: 5, taxRate: 5, hsnCode: '6203', taxableAmount: 20357.14, cgst: 508.93, sgst: 508.93, igst: 0, totalAmount: 21375 },
                // 40×480=19200, disc 5%=960, after=18240, taxable=18240/1.05=17371.43, cgst/sgst=434.29
                { size: '26', quantity: 40, unitPrice: 480, discount: 5, taxRate: 5, hsnCode: '6203', taxableAmount: 17371.43, cgst: 434.29, sgst: 434.29, igst: 0, totalAmount: 18240 },
            ],
        },
        {
            name: 'School Tie - Striped',
            sku: 'SXV-TIE-STR',
            isCustomItem: false,
            variants: [
                // 100×120=12000, no disc, taxable=12000/1.05=11428.57, cgst/sgst=285.71
                { size: 'Standard', quantity: 100, unitPrice: 120, discount: 0, taxRate: 5, hsnCode: '6215', taxableAmount: 11428.57, cgst: 285.71, sgst: 285.71, igst: 0, totalAmount: 12000 },
            ],
        },
        {
            name: 'School Belt - Black Leather',
            sku: 'SXV-BELT-BL',
            isCustomItem: false,
            variants: [
                // 60×180=10800, taxable=10800/1.05=10285.71, cgst/sgst=257.14
                { size: 'S', quantity: 60, unitPrice: 180, discount: 0, taxRate: 5, hsnCode: '4203', taxableAmount: 10285.71, cgst: 257.14, sgst: 257.14, igst: 0, totalAmount: 10800 },
                // 40×200=8000, taxable=8000/1.05=7619.05, cgst/sgst=190.48
                { size: 'M', quantity: 40, unitPrice: 200, discount: 0, taxRate: 5, hsnCode: '4203', taxableAmount: 7619.05, cgst: 190.48, sgst: 190.48, igst: 0, totalAmount: 8000 },
            ],
        },
    ],

    // subtotal = sum of grossAmounts (qty×price, tax-inclusive): 17500+14800+13650+22500+19200+12000+10800+8000 = 118450
    // totalDiscount = 1750+1480+1365+1125+960+0+0+0 = 6680
    // grandTotal = subtotal - totalDiscount = 118450 - 6680 = 111770
    subtotal: 118450,
    totalDiscount: 6680,
    totalTaxableAmount: 106447.61,
    totalCGST: 2661.19,
    totalSGST: 2661.19,
    totalIGST: 0,
    totalTax: 5322.39,
    grandTotal: 111770,
    roundOff: 0,
    amountInWords: 'Rupees One Lakh Eleven Thousand Seven Hundred and Seventy Only',

    shippingCharges: 0,
    additionalCharges: 0,

    paymentStatus: 'PARTIAL',
    amountPaid: 50000,
    paymentDueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    payments: [
        { date: new Date(Date.now() - 5 * 86400000).toISOString(), amount: 50000, method: 'BANK_TRANSFER', referenceNo: 'NEFT-2526031600123', remarks: 'Advance payment' },
    ],

    paymentTerms: 'Net 30 days from date of invoice. Late payment will attract 1.5% interest per month.',
    deliveryTerms: 'Delivery within 7-10 working days. Items to be delivered at school premises.',
    footerNote: '1. Goods once sold will not be taken back.\n2. Subject to Mumbai jurisdiction.\n3. E. & O.E.',
};

const MOCK_CASH_BILL = {
    _id: 'test-cash',
    documentNumber: 'CB-2526-00015',
    documentType: 'CASH_BILL',
    status: 'DRAFT',
    billType: 'CGST',
    createdAt: new Date().toISOString(),
    paymentMode: 'UPI',

    sender: { ...MOCK_TAX_INVOICE.sender },

    walkInCustomer: {
        name: 'Rajesh Sharma',
        phone: '9876501234',
    },

    // Prices are TAX-INCLUSIVE (MRP). Tax is reverse-calculated.
    items: [
        {
            name: 'Boys White Shirt - Half Sleeve',
            sku: 'GEN-SHIRT-WH',
            variants: [
                // 2×399=798, no disc, taxable=798/1.05=760.00, cgst/sgst=19.00 each
                { size: '30', quantity: 2, unitPrice: 399, discount: 0, taxRate: 5, hsnCode: '6205', taxableAmount: 760.00, cgst: 19.00, sgst: 19.00, igst: 0, totalAmount: 798 },
            ],
        },
        {
            name: 'Boys Grey Trouser',
            sku: 'GEN-TROU-GR',
            variants: [
                // 2×499=998, no disc, taxable=998/1.05=950.48, cgst/sgst=23.76 each
                { size: '30', quantity: 2, unitPrice: 499, discount: 0, taxRate: 5, hsnCode: '6203', taxableAmount: 950.48, cgst: 23.76, sgst: 23.76, igst: 0, totalAmount: 998 },
            ],
        },
    ],

    subtotal: 1796,
    totalDiscount: 0,
    totalTaxableAmount: 1710.48,
    totalCGST: 42.76,
    totalSGST: 42.76,
    totalIGST: 0,
    totalTax: 85.52,
    grandTotal: 1796,
    roundOff: 0,
    amountInWords: 'Rupees One Thousand Seven Hundred Ninety Six Only',
    shippingCharges: 0,
    additionalCharges: 0,
    paymentStatus: 'PAID',
    amountPaid: 1796,
    payments: [
        { date: new Date().toISOString(), amount: 1796, method: 'UPI', referenceNo: 'UPI-9876501234@ybl', remarks: 'Paid at counter' },
    ],
    footerNote: '1. Goods once sold will not be taken back.\n2. Subject to Mumbai jurisdiction.',
};

const MOCK_CREDIT_NOTE = {
    _id: 'test-cn',
    documentNumber: 'CN-2526-00003',
    documentType: 'CREDIT_NOTE',
    status: 'DRAFT',
    billType: 'CGST',
    createdAt: new Date().toISOString(),
    linkedInvoice: { documentNumber: 'INV-2526-00042' },
    reason: 'Goods returned - wrong size delivered for 10 shirts',

    sender: { ...MOCK_TAX_INVOICE.sender },
    buyer: { ...MOCK_TAX_INVOICE.buyer },

    // Prices are TAX-INCLUSIVE (MRP). Tax is reverse-calculated.
    items: [
        {
            name: 'Boys White Shirt - Half Sleeve',
            sku: 'SXV-SHIRT-WH-HS',
            variants: [
                // 10×370=3700, disc 10%=370, after=3330, taxable=3330/1.05=3171.43, cgst/sgst=79.29 each
                { size: '26', quantity: 10, unitPrice: 370, discount: 10, taxRate: 5, hsnCode: '6205', taxableAmount: 3171.43, cgst: 79.29, sgst: 79.29, igst: 0, totalAmount: 3330 },
            ],
        },
    ],

    subtotal: 3700,
    totalDiscount: 370,
    totalTaxableAmount: 3171.43,
    totalCGST: 79.29,
    totalSGST: 79.29,
    totalIGST: 0,
    totalTax: 158.58,
    grandTotal: 3330,
    roundOff: 0,
    amountInWords: 'Rupees Three Thousand Three Hundred Thirty Only',
    shippingCharges: 0,
    additionalCharges: 0,
};

const MOCK_DOCS = {
    TAX_INVOICE: MOCK_TAX_INVOICE,
    CASH_BILL: MOCK_CASH_BILL,
    CREDIT_NOTE: MOCK_CREDIT_NOTE,
};

const TestBillScreen = () => {
    const [selectedType, setSelectedType] = useState('TAX_INVOICE');

    const doc = MOCK_DOCS[selectedType];

    return (
        <div>
            <div className="no-print" style={{ padding: '15px 20px', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 15 }}>
                <strong>TEST PREVIEW</strong>
                <Form.Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ width: 220 }}
                >
                    <option value="TAX_INVOICE">Tax Invoice</option>
                    <option value="CASH_BILL">Cash Bill</option>
                    <option value="CREDIT_NOTE">Credit Note</option>
                </Form.Select>
                <Button variant="primary" size="sm" onClick={() => window.print()}>
                    <i className="fas fa-print me-1"></i> Print / Save PDF
                </Button>
                <span className="text-muted" style={{ fontSize: 12 }}>
                    Use browser's "Save as PDF" in print dialog to check A4 layout
                </span>
            </div>
            <DocumentPrintTemplate document={doc} />
        </div>
    );
};

export default TestBillScreen;
