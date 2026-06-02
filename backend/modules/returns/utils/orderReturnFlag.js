import ReturnRequest from '../models/ReturnRequestModel.js';
import Order from '../../../models/OrderModel.js';

/**
 * Derive and persist Order.hasReturns from the live (non-terminal) returns
 * for that order. Call after any create/cancel/reject so the flag reflects
 * reality instead of being stuck true forever (H3).
 * @param {string|import('mongoose').Types.ObjectId} orderId - Order _id
 * @returns {Promise<boolean>} the new hasReturns value
 */
export const recomputeOrderReturnFlag = async (orderId) => {
  const hasActive = await ReturnRequest.exists({
    order: orderId,
    status: { $nin: ['REJECTED', 'CANCELLED'] },
  });
  await Order.updateOne({ _id: orderId }, { $set: { hasReturns: Boolean(hasActive) } });
  return Boolean(hasActive);
};

export default { recomputeOrderReturnFlag };
