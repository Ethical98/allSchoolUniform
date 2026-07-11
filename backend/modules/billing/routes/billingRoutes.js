import express from 'express';
import { protect, admin } from '../../../Middleware/authMiddleware.js';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  searchCompanies,
} from '../controllers/companyController.js';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  cloneQuotation,
  convertQuotation,
  createRevision,
  getProductsForPicker,
  createCashBill,
  createCreditNote,
  createDebitNote,
  recordPayment,
  getBillingReport,
} from '../controllers/quotationController.js';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController.js';
import {
  getBillingConfig,
  updateBillingConfig,
} from '../controllers/billingConfigController.js';

const router = express.Router();

// All routes require admin auth
router.use(protect, admin);

// Billing config (singleton)
router.route('/config').get(getBillingConfig).put(updateBillingConfig);

// Company routes
router.route('/companies').get(getCompanies).post(createCompany);
router.route('/companies/search').get(searchCompanies);
router.route('/companies/:id').get(getCompanyById).put(updateCompany).delete(deleteCompany);

// Quotation routes — static paths MUST come before :id param routes
router.route('/quotations').get(getQuotations).post(createQuotation);
router.route('/quotations/products').get(getProductsForPicker);
router.route('/quotations/:id').get(getQuotationById).put(updateQuotation).delete(deleteQuotation);
router.route('/quotations/:id/status').patch(updateQuotationStatus);
router.route('/quotations/:id/clone').post(cloneQuotation);
router.route('/quotations/:id/convert').post(convertQuotation);
router.route('/quotations/:id/revision').post(createRevision);
router.route('/quotations/:id/payment').post(recordPayment);

// Cash bill route
router.route('/cash-bill').post(createCashBill);

// Credit note / Debit note routes
router.route('/credit-note').post(createCreditNote);
router.route('/debit-note').post(createDebitNote);

// Report route
router.route('/report').get(getBillingReport);

// Template routes
router.route('/templates').get(getTemplates).post(createTemplate);
router.route('/templates/:id').get(getTemplateById).put(updateTemplate).delete(deleteTemplate);

export default router;
