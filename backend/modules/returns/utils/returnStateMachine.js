/**
 * Return request state machine.
 * Enforces valid status transitions and type-specific rules.
 */

const TRANSITIONS = {
  INITIATED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PICKUP_SCHEDULED', 'RECEIVED', 'CANCELLED'],
  PICKUP_SCHEDULED: ['IN_TRANSIT', 'PICKUP_FAILED', 'CANCELLED'],
  PICKUP_FAILED: ['PICKUP_SCHEDULED', 'RECEIVED', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: ['QC_IN_PROGRESS'],
  QC_IN_PROGRESS: ['QC_COMPLETED'],
  QC_COMPLETED: [
    'REFUND_INITIATED',
    'EXCHANGE_SHIPPED',
    'REPLACEMENT_SHIPPED',
  ],
  REFUND_INITIATED: ['COMPLETED'],
  EXCHANGE_SHIPPED: ['COMPLETED'],
  REPLACEMENT_SHIPPED: ['COMPLETED'],
  // Terminal states
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

// Type-specific rules from QC_COMPLETED
const TYPE_TRANSITIONS = {
  RETURN: { allowed: ['REFUND_INITIATED'] },
  EXCHANGE: { allowed: ['EXCHANGE_SHIPPED', 'REFUND_INITIATED'] },
  REPLACEMENT: { allowed: ['REPLACEMENT_SHIPPED'] },
};

/**
 * Validate a status transition.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @param {string} type - RETURN | EXCHANGE | REPLACEMENT
 * @returns {true} if valid
 * @throws {Error} if invalid
 */
export const validateTransition = (currentStatus, nextStatus, type) => {
  const allowed = TRANSITIONS[currentStatus];

  if (!allowed) {
    throw new Error(`Unknown status: ${currentStatus}`);
  }

  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid transition: ${currentStatus} → ${nextStatus}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`
    );
  }

  // Enforce type-specific rules at QC_COMPLETED
  if (currentStatus === 'QC_COMPLETED') {
    const typeRule = TYPE_TRANSITIONS[type];
    if (typeRule && !typeRule.allowed.includes(nextStatus)) {
      throw new Error(
        `${type} requests cannot transition from QC_COMPLETED to ${nextStatus}. Allowed: ${typeRule.allowed.join(', ')}`
      );
    }
  }

  return true;
};

/**
 * Check if a status is terminal (no further transitions possible).
 */
export const isTerminalStatus = (status) => {
  return (
    TRANSITIONS[status] !== undefined && TRANSITIONS[status].length === 0
  );
};

/**
 * Get the list of valid next statuses for a given status and type.
 */
export const getNextStatuses = (currentStatus, type) => {
  const allowed = TRANSITIONS[currentStatus] || [];

  if (currentStatus === 'QC_COMPLETED' && type) {
    const typeRule = TYPE_TRANSITIONS[type];
    if (typeRule) {
      return allowed.filter((s) => typeRule.allowed.includes(s));
    }
  }

  return allowed;
};

export default { validateTransition, isTerminalStatus, getNextStatuses };
