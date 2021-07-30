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

export { getClasses };
