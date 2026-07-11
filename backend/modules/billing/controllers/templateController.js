import asyncHandler from 'express-async-handler';
import DocumentTemplate from '../models/DocumentTemplateModel.js';

// @desc    Create a new template
// @route   POST /api/billing/templates
// @access  Private/Admin
const createTemplate = asyncHandler(async (req, res) => {
  const { name, type, content, isDefault } = req.body;

  if (isDefault) {
    await DocumentTemplate.updateMany(
      { type, isDefault: true },
      { isDefault: false }
    );
  }

  const template = await DocumentTemplate.create({
    name,
    type,
    content,
    isDefault,
    createdBy: req.user._id,
  });

  res.status(201).json(template);
});

// @desc    Get all templates
// @route   GET /api/billing/templates
// @access  Private/Admin
const getTemplates = asyncHandler(async (req, res) => {
  const type = req.query.type || '';

  const filter = { isActive: true };
  if (type) {
    filter.type = type;
  }

  const templates = await DocumentTemplate.find(filter).sort({ isDefault: -1, name: 1 });

  res.json(templates);
});

// @desc    Get template by ID
// @route   GET /api/billing/templates/:id
// @access  Private/Admin
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);

  if (template) {
    res.json(template);
  } else {
    res.status(404);
    throw new Error('Template not found');
  }
});

// @desc    Update template
// @route   PUT /api/billing/templates/:id
// @access  Private/Admin
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  if (req.body.isDefault && !template.isDefault) {
    await DocumentTemplate.updateMany(
      { type: template.type, isDefault: true },
      { isDefault: false }
    );
  }

  template.name = req.body.name || template.name;
  template.type = req.body.type || template.type;
  template.content = req.body.content !== undefined ? req.body.content : template.content;
  template.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : template.isDefault;

  const updated = await template.save();
  res.json(updated);
});

// @desc    Delete template (soft delete)
// @route   DELETE /api/billing/templates/:id
// @access  Private/Admin
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  template.isActive = false;
  await template.save();

  res.json({ message: 'Template removed' });
});

export {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
