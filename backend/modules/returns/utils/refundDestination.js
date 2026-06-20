// Refund-destination validation for COD returns. Mirrors the frontend
// lib/returns/refundValidation.ts rules exactly. Pure; no DB access.

const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RE = /^\d{9,18}$/;

export function isValidUpiId(v) {
  return typeof v === 'string' && UPI_RE.test(v.trim());
}
export function isValidIfsc(v) {
  return typeof v === 'string' && IFSC_RE.test(v.trim().toUpperCase());
}
export function isValidAccountNumber(v) {
  return typeof v === 'string' && ACCOUNT_RE.test(v.trim());
}
export function isValidAccountHolder(v) {
  return typeof v === 'string' && v.trim().length >= 2;
}

// Returns { ok, error?, normalized? }. Prepaid: ok with no normalized fields.
// COD: requires a valid UPI or bank destination; normalizes (trims, uppercases IFSC).
export function validateRefundDestination({
  paymentMethod,
  refundMethod,
  refundUpiId,
  refundBankDetails,
} = {}) {
  if (paymentMethod !== 'COD') {
    return { ok: true, normalized: {} };
  }
  if (refundMethod === 'UPI') {
    const upi = (refundUpiId || '').trim();
    if (!isValidUpiId(upi)) return { ok: false, error: 'A valid UPI ID is required for the refund.' };
    return { ok: true, normalized: { refundMethod: 'UPI', refundUpiId: upi } };
  }
  if (refundMethod === 'BANK_TRANSFER') {
    const b = refundBankDetails || {};
    const name = (b.accountHolderName || '').trim();
    const acc = (b.accountNumber || '').trim();
    const ifsc = (b.ifscCode || '').trim().toUpperCase();
    if (!isValidAccountHolder(name)) return { ok: false, error: 'Account holder name is required.' };
    if (!isValidAccountNumber(acc)) return { ok: false, error: 'A valid account number (9–18 digits) is required.' };
    if (!isValidIfsc(ifsc)) return { ok: false, error: 'A valid IFSC code is required.' };
    return { ok: true, normalized: { refundMethod: 'BANK_TRANSFER', refundBankDetails: { accountHolderName: name, accountNumber: acc, ifscCode: ifsc } } };
  }
  return { ok: false, error: 'A refund destination (UPI or bank) is required for COD orders.' };
}
