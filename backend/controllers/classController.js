import asyncHandler from 'express-async-handler';
import Class from '../models/ClassModel.js';

// @desc Get All Classes
// @route GET /api/classes
// @access Public
const getClasses = asyncHandler(async (req, res) => {
  const standard = await Class.find();
  if (standard) {
    res.json(standard);
  } else {
    throw new Error('Empty Class');
  }
});

// @desc Create Class
// @route POST /api/classes
// @access Private/Admin
const createClass = asyncHandler(async (req, res) => {
  const { className } = req.body;
  console.log(className);
  const standard = new Class({
    class: className,
  });
  console.log(className);
  const createdClass = await standard.save();
  res.status(201).json(createdClass);
});

// @desc Delete Class
// @route DELETE /api/classes/:id
// @access Private/Admin
const deleteClass = asyncHandler(async (req, res) => {
  const standard = await Class.findById(req.params.id);

  if (standard) {
    await standard.remove();
    res.json({ message: 'Class removed' });
  } else {
    res.status(404);
    throw new Error('Class Not Found');
  }
});

// @desc Update Class
// @route PUT /api/classes/:id
// @access Private/Admin
const updateClass = asyncHandler(async (req, res) => {
  const standard = await Class.findById(req.params.id);

  if (standard) {
    standard.class = req.body.class;

    const updatedClass = await standard.save();
    res.status(200).json(updatedClass);
  } else {
    res.status(404);
    throw new Error('Class Not Found');
  }
});

export { getClasses, createClass, deleteClass, updateClass };
