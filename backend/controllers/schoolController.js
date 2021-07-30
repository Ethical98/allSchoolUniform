import asyncHandler from 'express-async-handler';
import School from '../models/SchoolModel.js';

// @desc Get SchoolList
// @route GET /api/schools
// @access Private/Admin
const getSchools = asyncHandler(async (req, res) => {
  const schools = await School.find();

  if (schools) {
    res.json(schools);
  } else {
    res.status(404);
    throw new Error('School List empty');
  }
});

export { getSchools };
