import asyncHandler from 'express-async-handler';
import BillCompany from '../models/CompanyModel.js';
import { escapeRegex } from '../../../utils/stringUtils.js';

// @desc    Create a new company
// @route   POST /api/billing/companies
// @access  Private/Admin
const createCompany = asyncHandler(async (req, res) => {
  const {
    companyType, name, address, addressLine1, addressLine2, city, state, pincode, country,
    contactPerson, phone, email, website, gstin, pan, logo,
    bankName, accountNumber, ifscCode, branchName, upiId,
    schoolRef, isDefault,
  } = req.body;

  // Check for duplicate company name within the same type
  const existing = await BillCompany.findOne({ name, companyType, isActive: true });
  if (existing) {
    res.status(400);
    throw new Error(`A ${companyType} company with the name "${name}" already exists`);
  }

  // If setting as default, unset any existing default of same type
  if (isDefault) {
    await BillCompany.updateMany(
      { companyType, isDefault: true },
      { isDefault: false }
    );
  }

  const company = await BillCompany.create({
    companyType,
    name,
    address,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    country,
    contactPerson,
    phone,
    email,
    website,
    gstin,
    pan,
    logo,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    upiId,
    schoolRef,
    isDefault,
    createdBy: req.user._id,
  });

  res.status(201).json(company);
});

// @desc    Get all companies (paginated, filterable)
// @route   GET /api/billing/companies
// @access  Private/Admin
const getCompanies = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.page) || 1;
  const companyType = req.query.type || '';
  const search = req.query.search || '';

  const filter = { isActive: true };

  if (companyType) {
    filter.companyType = companyType;
  }

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  const count = await BillCompany.countDocuments(filter);
  const companies = await BillCompany.find(filter)
    .sort({ isDefault: -1, name: 1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    companies,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get company by ID
// @route   GET /api/billing/companies/:id
// @access  Private/Admin
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await BillCompany.findById(req.params.id);

  if (company) {
    res.json(company);
  } else {
    res.status(404);
    throw new Error('Company not found');
  }
});

// @desc    Update company
// @route   PUT /api/billing/companies/:id
// @access  Private/Admin
const updateCompany = asyncHandler(async (req, res) => {
  const company = await BillCompany.findById(req.params.id);

  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  // If setting as default, unset existing defaults
  if (req.body.isDefault && !company.isDefault) {
    await BillCompany.updateMany(
      { companyType: company.companyType, isDefault: true },
      { isDefault: false }
    );
  }

  const fields = [
    'name', 'companyType', 'address', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'country',
    'contactPerson', 'phone', 'email', 'website', 'gstin', 'pan', 'logo',
    'bankName', 'accountNumber', 'ifscCode', 'branchName', 'upiId',
    'schoolRef', 'isDefault', 'isActive',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      company[field] = req.body[field];
    }
  });

  const updatedCompany = await company.save();
  res.json(updatedCompany);
});

// @desc    Delete company (soft delete)
// @route   DELETE /api/billing/companies/:id
// @access  Private/Admin
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await BillCompany.findById(req.params.id);

  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  company.isActive = false;
  await company.save();

  res.json({ message: 'Company removed' });
});

// @desc    Search companies (for typeahead)
// @route   GET /api/billing/companies/search
// @access  Private/Admin
const searchCompanies = asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  const companyType = req.query.type || '';

  const filter = { isActive: true };

  if (companyType) {
    filter.companyType = companyType;
  }

  if (query) {
    filter.name = { $regex: escapeRegex(query), $options: 'i' };
  }

  const companies = await BillCompany.find(filter)
    .select('name companyType gstin city phone isDefault')
    .sort({ isDefault: -1, name: 1 })
    .limit(20);

  res.json(companies);
});

export {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  searchCompanies,
};
