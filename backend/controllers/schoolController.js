import asyncHandler from 'express-async-handler';
import School from '../models/SchoolModel.js';
import paginate from '../utils/pagination.js';
import fs from 'fs';
import sharp from 'sharp';
import path from 'path';


// @desc Get SchoolList
// @route GET /api/schools
// @access Private/Admin
const getSchools = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const schools = await School.find()
    .sort({
      name: 'asc',
    })
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  const count = await School.countDocuments({});
  if (schools) {
    res.json({ schools, page, pages: Math.ceil(count / pageSize) });
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
  const { keyword } = req.params;

  const keyword1 = keyword
    ? {
        name: {
          $regex: keyword,
          $options: 'i',
        },
      }
    : {};

  const schoolNames = await School.find(keyword1).select('name isActive');

  if (schoolNames) {
    res.json(schoolNames);
  } else {
    res.json([]);
    // res.status(404);
    // throw new Error('School List empty');
  }
});

// @desc Create School
// @route POST /api/schools
// @access Private/Admin
const createSchool = asyncHandler(async (req, res) => {
  const {
    name,
    address,
    contact,
    logo,
    state,
    city,
    description,
    website,
    email,
    country,
    isActive,
  } = req.body;
  const school = new School({
    name,
    address,
    contact,
    logo,
    state,
    city,
    description,
    website,
    email,
    country,
    isActive,
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
  const {
    name,
    address,
    logo,
    contact,
    disabled,
    state,
    city,
    country,
    website,
    email,
    description,
    isActive,
  } = req.body;

  if (school) {
    school.name = name || school.name;
    school.disabled = disabled;
    school.logo = logo || school.logo;
    school.address = address || school.address;
    school.contact = contact || school.contact;
    school.description = description || school.description;
    school.city = city || school.city;
    school.state = state || school.state;
    school.country = country || school.country;
    school.email = email || school.email;
    school.website = website || school.website;
    school.isActive = isActive;

    const updatedSchool = await school.save();
    res.status(200).json(updatedSchool);
  } else {
    res.status(404);
    throw new Error('School Not Found');
  }
});

// @desc  Get School logo Images
// @route GET /api/schools/images
// @access Public
const getSchoolImages = asyncHandler(async (req, res) => {
  const __dirname = path.resolve();
  const imagesPerPage = 12;
  const currentPage = req.query.page || 1;
  const imagesFolder = path.join(__dirname, '/uploads/schools/');

  const images = [];

  const files = fs.readdirSync(imagesFolder);

  files.sort(
    (a, b) =>
      fs.statSync(imagesFolder + b).mtime.getTime() -
      fs.statSync(imagesFolder + a).mtime.getTime()
  );

  files.forEach((file) => {
    images.push({ url: `\\uploads\\schools\\${file}`, name: file });
  });

  const { currentImages, pages } = paginate(currentPage, imagesPerPage, images);

  res.send({ images: currentImages, pages: pages });
});

// @desc Upload School Images
// @route POST /api/schools/images
// @access Public
const uploadSchoolImages = asyncHandler(async (req, res) => {
  if (req.file) {
    const newFilename = `${
      req.file.originalname.split('.')[0]
    }-${Date.now()}${path.extname(req.file.originalname)}`;

    await sharp(req.file.buffer)
      .resize({ width: 300, height: 300 })
      .toFile('uploads/schools/resized-' + newFilename);

    res.send(`/uploads/schools/resized-${newFilename}`);
  }
});
export {
  getSchools,
  getSchoolNames,
  deleteSchool,
  updateSchool,
  getSchoolDetails,
  createSchool,
  uploadSchoolImages,
  getSchoolImages,
};
