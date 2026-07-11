import React from 'react';

const DOCUMENT_TITLES = {
  QUOTATION: 'QUOTATION',
  PROFORMA_INVOICE: 'PROFORMA INVOICE',
  TAX_INVOICE: 'TAX INVOICE',
  CASH_BILL: 'CASH BILL',
  CREDIT_NOTE: 'CREDIT NOTE',
  DEBIT_NOTE: 'DEBIT NOTE',
};

const DocumentPrintTemplate = ({ document: doc, billingConfig: cfg }) => {
  if (!doc) return null;

  // Config defaults (fallback if config not loaded)
  const showHSN = cfg?.showHSN ?? true;
  const showSKU = cfg?.showSKU ?? true;
  const showPaymentInfo = cfg?.showPaymentInfo ?? true;
  const taxEnabled = cfg?.taxEnabled ?? true;

  const isCashBill = doc.documentType === 'CASH_BILL';
  const isCreditDebitNote = ['CREDIT_NOTE', 'DEBIT_NOTE'].includes(doc.documentType);
  const title = DOCUMENT_TITLES[doc.documentType] || 'DOCUMENT';
  const isCGST = doc.billType === 'CGST';

  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  // Flatten items → variants into rows for the table
  const tableRows = [];
  let sno = 0;
  (doc.items || []).forEach((item) => {
    (item.variants || []).forEach((v) => {
      sno++;
      tableRows.push({
        sno,
        name: item.name || '',
        sku: item.sku || '',
        hsnCode: v.hsnCode || '',
        size: v.size || '-',
        quantity: v.quantity || 0,
        unitPrice: v.unitPrice || 0,
        discount: v.discount || 0,
        taxRate: v.taxRate || 0,
        taxableAmount: v.taxableAmount || 0,
        cgst: v.cgst || 0,
        sgst: v.sgst || 0,
        igst: v.igst || 0,
        totalAmount: v.totalAmount || 0,
      });
    });
  });

  return (
    <>
      <style>{printStyles}</style>
      <div className="print-document">
        {/* Header */}
        <div className="doc-header">
          <div className="doc-header-left">
            {doc.sender?.logo && (
              <img src={doc.sender.logo} alt="Logo" className="doc-logo" />
            )}
            <div className="sender-brief">
              <h2>{doc.sender?.name || ''}</h2>
              {doc.sender?.address && <p>{doc.sender.address}</p>}
              <p>
                {[doc.sender?.city, doc.sender?.state, doc.sender?.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {doc.sender?.gstin && <p><strong>GSTIN:</strong> {doc.sender.gstin}</p>}
              {doc.sender?.pan && <p><strong>PAN:</strong> {doc.sender.pan}</p>}
            </div>
          </div>
          <div className="doc-header-right">
            <h1 className="doc-title">{title}</h1>
            <table className="doc-meta-table">
              <tbody>
                <tr>
                  <td>Document No:</td>
                  <td><strong>{doc.documentNumber}</strong></td>
                </tr>
                <tr>
                  <td>Date:</td>
                  <td>{formatDate(doc.createdAt)}</td>
                </tr>
                {doc.validUntil && (
                  <tr>
                    <td>Valid Until:</td>
                    <td>{formatDate(doc.validUntil)}</td>
                  </tr>
                )}
                {doc.placeOfSupply && (
                  <tr>
                    <td>Place of Supply:</td>
                    <td>{doc.placeOfSupply}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <hr className="doc-divider" />

        {/* Party Details */}
        <div className="party-section">
          <div className="party-box">
            <h4>Bill From</h4>
            <p className="party-name">{doc.sender?.name || '-'}</p>
            {doc.sender?.address && <p>{doc.sender.address}</p>}
            <p>{[doc.sender?.city, doc.sender?.state, doc.sender?.pincode].filter(Boolean).join(', ')}</p>
            {doc.sender?.gstin && <p>GSTIN: {doc.sender.gstin}</p>}
            {doc.sender?.phone && <p>Phone: {doc.sender.phone}</p>}
            {doc.sender?.email && <p>Email: {doc.sender.email}</p>}
          </div>
          <div className="party-box">
            {isCashBill ? (
              <>
                <h4>Customer</h4>
                <p className="party-name">{doc.walkInCustomer?.name || 'Walk-in Customer'}</p>
                {doc.walkInCustomer?.phone && <p>Phone: {doc.walkInCustomer.phone}</p>}
                {doc.paymentMode && <p>Payment Mode: <strong>{doc.paymentMode}</strong></p>}
              </>
            ) : (
              <>
                <h4>Bill To</h4>
                <p className="party-name">{doc.buyer?.name || '-'}</p>
                {doc.buyer?.address && <p>{doc.buyer.address}</p>}
                <p>{[doc.buyer?.city, doc.buyer?.state, doc.buyer?.pincode].filter(Boolean).join(', ')}</p>
                {doc.buyer?.gstin && <p>GSTIN: {doc.buyer.gstin}</p>}
                {doc.buyer?.contactPerson && <p>Contact: {doc.buyer.contactPerson}</p>}
                {doc.buyer?.phone && <p>Phone: {doc.buyer.phone}</p>}
                {doc.buyer?.email && <p>Email: {doc.buyer.email}</p>}
              </>
            )}
          </div>
        </div>

        {/* Linked Invoice (for CN/DN) */}
        {isCreditDebitNote && doc.linkedInvoice && (
          <div className="linked-info">
            <strong>Against Invoice:</strong> {doc.linkedInvoice.documentNumber || doc.linkedInvoice}
            {doc.reason && <span> | <strong>Reason:</strong> {doc.reason}</span>}
          </div>
        )}

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th className="desc-col">Description</th>
              {showHSN && <th>HSN</th>}
              <th>Size</th>
              <th className="num-col">Qty</th>
              <th className="num-col">Rate</th>
              <th className="num-col">Disc%</th>
              {taxEnabled && <th className="num-col">Taxable</th>}
              {taxEnabled && (isCGST ? (
                <>
                  <th className="num-col">CGST</th>
                  <th className="num-col">SGST</th>
                </>
              ) : (
                <th className="num-col">IGST</th>
              ))}
              <th className="num-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.sno}>
                <td>{row.sno}</td>
                <td className="desc-col">
                  {row.name}
                  {showSKU && row.sku && <span className="sku-label"> ({row.sku})</span>}
                </td>
                {showHSN && <td>{row.hsnCode}</td>}
                <td>{row.size}</td>
                <td className="num-col">{row.quantity}</td>
                <td className="num-col">{formatCurrency(row.unitPrice)}</td>
                <td className="num-col">{row.discount}%</td>
                {taxEnabled && <td className="num-col">{formatCurrency(row.taxableAmount)}</td>}
                {taxEnabled && (isCGST ? (
                  <>
                    <td className="num-col">{formatCurrency(row.cgst)}</td>
                    <td className="num-col">{formatCurrency(row.sgst)}</td>
                  </>
                ) : (
                  <td className="num-col">{formatCurrency(row.igst)}</td>
                ))}
                <td className="num-col">{formatCurrency(row.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="totals-section">
          <div className="totals-words">
            {doc.amountInWords && (
              <p><strong>Amount in Words:</strong> {doc.amountInWords}</p>
            )}
          </div>
          <table className="totals-table">
            <tbody>
              {taxEnabled && (
                <tr>
                  <td>Subtotal</td>
                  <td className="num-col">{formatCurrency(doc.totalTaxableAmount)}</td>
                </tr>
              )}
              {doc.totalDiscount > 0 && (
                <tr>
                  <td>Discount</td>
                  <td className="num-col">-{formatCurrency(doc.totalDiscount)}</td>
                </tr>
              )}
              {taxEnabled && (isCGST ? (
                <>
                  <tr>
                    <td>CGST</td>
                    <td className="num-col">{formatCurrency(doc.totalCGST)}</td>
                  </tr>
                  <tr>
                    <td>SGST</td>
                    <td className="num-col">{formatCurrency(doc.totalSGST)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td>IGST</td>
                  <td className="num-col">{formatCurrency(doc.totalIGST)}</td>
                </tr>
              ))}
              {(doc.shippingCharges > 0) && (
                <tr>
                  <td>Shipping Charges</td>
                  <td className="num-col">{formatCurrency(doc.shippingCharges)}</td>
                </tr>
              )}
              {(doc.additionalCharges > 0) && (
                <tr>
                  <td>Additional Charges</td>
                  <td className="num-col">{formatCurrency(doc.additionalCharges)}</td>
                </tr>
              )}
              {doc.roundOff !== 0 && (
                <tr>
                  <td>Round Off</td>
                  <td className="num-col">{formatCurrency(doc.roundOff)}</td>
                </tr>
              )}
              <tr className="grand-total-row">
                <td><strong>Grand Total</strong></td>
                <td className="num-col"><strong>{formatCurrency(doc.grandTotal)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Info (for invoices) */}
        {showPaymentInfo && doc.sender?.bankName && !isCashBill && (
          <div className="bank-details">
            <h4>Bank Details</h4>
            <table className="bank-table">
              <tbody>
                <tr><td>Bank Name:</td><td>{doc.sender.bankName}</td></tr>
                <tr><td>Account No:</td><td>{doc.sender.accountNumber}</td></tr>
                <tr><td>IFSC Code:</td><td>{doc.sender.ifscCode}</td></tr>
                {doc.sender.branchName && <tr><td>Branch:</td><td>{doc.sender.branchName}</td></tr>}
                {doc.sender.upiId && <tr><td>UPI:</td><td>{doc.sender.upiId}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment History */}
        {doc.payments && doc.payments.length > 0 && (
          <div className="payment-history no-print">
            <h4>Payment History</h4>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {doc.payments.map((p, i) => (
                  <tr key={i}>
                    <td>{formatDate(p.date)}</td>
                    <td className="num-col">{formatCurrency(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{p.referenceNo || '-'}</td>
                    <td>{p.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Terms & Delivery Terms */}
        {(doc.paymentTerms || doc.deliveryTerms) && (
          <div className="terms-section">
            {doc.paymentTerms && (
              <div>
                <h4>Payment Terms</h4>
                <p>{doc.paymentTerms}</p>
              </div>
            )}
            {doc.deliveryTerms && (
              <div>
                <h4>Delivery Terms</h4>
                <p>{doc.deliveryTerms}</p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {doc.footerNote && (
          <div className="terms-section">
            <h4>Terms & Conditions</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{doc.footerNote}</p>
          </div>
        )}

        {/* Signature */}
        <div className="signature-section">
          <div className="signature-box">
            <p>Receiver's Signature</p>
          </div>
          <div className="signature-box" style={{ textAlign: 'right' }}>
            <p>For <strong>{doc.sender?.name || ''}</strong></p>
            <br /><br />
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </>
  );
};

const printStyles = `
  .print-document {
    font-family: 'Segoe UI', Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: #222;
    font-size: 13px;
    line-height: 1.4;
  }

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .doc-header-left {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .doc-logo {
    max-width: 100px;
    max-height: 60px;
    object-fit: contain;
  }

  .sender-brief h2 {
    margin: 0 0 4px 0;
    font-size: 18px;
  }

  .sender-brief p {
    margin: 0;
    font-size: 11px;
    color: #444;
  }

  .doc-header-right {
    text-align: right;
  }

  .doc-title {
    font-size: 22px;
    font-weight: bold;
    color: #1a1a1a;
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .doc-meta-table td {
    padding: 1px 6px;
    font-size: 12px;
  }
  .doc-meta-table td:first-child {
    color: #666;
    text-align: right;
  }

  .doc-divider {
    border: none;
    border-top: 2px solid #333;
    margin: 10px 0;
  }

  .party-section {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
  }

  .party-box {
    flex: 1;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 4px;
  }

  .party-box h4 {
    margin: 0 0 6px 0;
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
    letter-spacing: 0.5px;
  }

  .party-name {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .party-box p {
    margin: 2px 0;
    font-size: 12px;
  }

  .linked-info {
    background: #fff3cd;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 15px;
    font-size: 12px;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 12px;
  }

  .items-table th {
    background: #f0f0f0;
    border: 1px solid #ccc;
    padding: 6px 8px;
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .items-table td {
    border: 1px solid #ddd;
    padding: 5px 8px;
    vertical-align: top;
  }

  .desc-col {
    min-width: 150px;
  }

  .num-col {
    text-align: right;
    white-space: nowrap;
  }

  .sku-label {
    font-size: 10px;
    color: #888;
  }

  .totals-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }

  .totals-words {
    flex: 1;
    padding-right: 20px;
    font-size: 12px;
    font-style: italic;
  }

  .totals-table {
    min-width: 280px;
    border-collapse: collapse;
  }

  .totals-table td {
    padding: 4px 10px;
    font-size: 12px;
    border-bottom: 1px solid #eee;
  }

  .totals-table .num-col {
    text-align: right;
    min-width: 100px;
  }

  .grand-total-row td {
    border-top: 2px solid #333;
    border-bottom: 2px solid #333;
    font-size: 14px;
    padding: 6px 10px;
  }

  .bank-details {
    margin-bottom: 15px;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 4px;
  }

  .bank-details h4 {
    margin: 0 0 6px 0;
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
  }

  .bank-table td {
    padding: 2px 8px;
    font-size: 12px;
  }
  .bank-table td:first-child {
    color: #666;
    width: 120px;
  }

  .terms-section {
    margin-bottom: 12px;
  }

  .terms-section h4 {
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
    margin: 0 0 4px 0;
  }

  .terms-section p {
    font-size: 12px;
    margin: 0;
  }

  .signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
    padding-top: 10px;
  }

  .signature-box {
    width: 200px;
  }

  .signature-box p {
    margin: 0;
    font-size: 12px;
    color: #666;
  }

  /* Print-specific styles */
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
    }
    body * {
      visibility: hidden;
    }
    .print-document,
    .print-document * {
      visibility: visible;
    }
    .print-document {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      max-width: none;
      padding: 10mm 15mm;
      font-size: 11px;
    }

    .no-print {
      display: none !important;
    }

    @page {
      size: A4;
      margin: 0;
    }

    .items-table {
      page-break-inside: auto;
    }
    .items-table tr {
      page-break-inside: avoid;
    }
    .items-table thead {
      display: table-header-group;
    }

    .signature-section {
      page-break-inside: avoid;
    }
  }
`;

export default DocumentPrintTemplate;
