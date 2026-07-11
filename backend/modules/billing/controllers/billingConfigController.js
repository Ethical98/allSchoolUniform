import asyncHandler from 'express-async-handler';
import BillingConfig from '../models/BillingConfigModel.js';

// @desc    Get billing configuration (singleton)
// @route   GET /api/billing/config
// @access  Private/Admin
const getBillingConfig = asyncHandler(async (req, res) => {
  let config = await BillingConfig.findOne();
  if (!config) {
    config = await BillingConfig.create({});
  }
  res.json(config);
});

// @desc    Update billing configuration
// @route   PUT /api/billing/config
// @access  Private/Admin
const updateBillingConfig = asyncHandler(async (req, res) => {
  const {
    showHSN,
    showSKU,
    showPaymentInfo,
    taxEnabled,
    defaultTaxRate,
    defaultHSNCode,
    standardTaxRates,
  } = req.body;

  const config = await BillingConfig.findOneAndUpdate(
    {},
    {
      showHSN,
      showSKU,
      showPaymentInfo,
      taxEnabled,
      defaultTaxRate,
      defaultHSNCode,
      standardTaxRates,
    },
    { new: true, upsert: true }
  );

  res.json(config);
});

export { getBillingConfig, updateBillingConfig };
