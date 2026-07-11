/**
 * Pure guards for return status transitions.
 * No DB access — callers fetch any related docs and pass them in.
 */

/**
 * Whether a return may transition to REFUND_INITIATED.
 * Blocks EXCHANGE/REPLACEMENT returns from being cash-refunded while a live
 * (non-cancelled) exchange order exists — otherwise the customer keeps the
 * exchanged goods AND gets a refund (H4).
 * @param {{ type:string, exchangeOrderId?:any }} returnRequest
 * @param {{ tracking?:{ isCanceled?:boolean } }|null} exchangeOrder - the linked exchange order, or null
 * @returns {{ ok:true } | { ok:false, reason:string }}
 */
export const canInitiateRefund = (returnRequest, exchangeOrder) => {
  if (returnRequest.type === 'RETURN') return { ok: true };
  if (!returnRequest.exchangeOrderId) return { ok: true };
  const cancelled = exchangeOrder?.tracking?.isCanceled === true;
  if (cancelled) return { ok: true };
  return {
    ok: false,
    reason:
      'Cannot initiate a cash refund: a live exchange/replacement order exists for this return. Cancel the exchange order first.',
  };
};
