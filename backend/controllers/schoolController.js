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

// @desc Get SchoolNameList
// @route GET /api/schools/name
// @access Private/Admin
const getSchoolDetails = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (school) {
    res.json(school);
  } else {
    res.status(404);
    throw new Error('School Not Found');
  }
});

// @desc Get School
// @route GET /api/schools/:id
// @access Public
const getSchoolNames = asyncHandler(async (req, res) => {
  const schoolNames = await School.find().select('name');

  if (schoolNames) {
    res.json(schoolNames);
  } else {
    res.status(404);
    throw new Error('School List empty');
  }
});

// @desc Create School
// @route POST /api/schools
// @access Private/Admin
const createSchool = asyncHandler(async (req, res) => {
  const { name, address, contact, logo, disabled } = req.body;
  const school = new School({
    name,
    address,
    contact,
    logo,
    disabled,
    user: req.user._id,
  });
  const createdSchool = await school.save();
  res.status(201).json(createdSchool);
});

// @desc Delete School
// @route DELETE /api/schools/:id
// @access Private/Admin
const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (school) {
    await school.remove();
    res.json({ message: 'School removed' });
  } else {
    res.status(404);
    throw new Error('School Not Found');
  }
});

// @desc Update School
// @route PUT /api/schools/:id
// @access Private/Admin
const updateSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  const { name, address, logo, contact, disabled } = req.body;

  if (school) {
    school.name = name || school.name;
    school.disabled = disabled;
    school.logo = logo || school.logo;
    school.address = address || school.address;
    school.contact = contact || school.contact;
    const updatedSchool = await school.save();
    res.status(200).json(updatedSchool);
  } else {
    res.status(404);
    throw new Error('School Not Found');
  }
});

export {
  getSchools,
  getSchoolNames,
  deleteSchool,
  updateSchool,
  getSchoolDetails,
  createSchool,
};
