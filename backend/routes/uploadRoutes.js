import path from 'path';
import express from 'express';
import upload from '../Middleware/uploadMiddleware.js';
import sharp from 'sharp';
import fs from 'fs';
import { errorHandler } from '../Middleware/errorMiddleware.js';
import { slugifyFilename } from '../utils/stringUtils.js';

const router = express.Router();

// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename(req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
let currentPage = 1;
let imagesPerPage = 12;

// router.post('/', upload.single('image'), async (req, res) => {
//   const { filename: image } = req.file;
//   console.log(req.file);

//   console.log(req.file.destination);
//   await sharp(req.file.path)
//     .resize({ width: 640, height: 640 })
//     .toFile(
//       'uploads/resized' +
//         `${req.file.originalname.split('.')[0]}-${Date.now()}${path.extname(
//           req.file.originalname
//         )}`
//     );
//   fs.unlinkSync(req.file.path);
//   console.log(req.file);
//   res.send(`/uploads/${req.file.filename}`);
// });

// router.post('/', (req, res) => {
//   console.log(req.file);
// });

router.post('/', upload.single('image'), errorHandler, async (req, res) => {
  if (req.file) {
    const newFilename = slugifyFilename(req.file.originalname);

    await sharp(req.file.buffer)
      .resize({ width: 640, height: 640 })
      .toFile('uploads/' + newFilename);

    res.send(`/uploads/${newFilename}`);
  }
});

// router.post(
//   '/schools',
//   upload.single('image'),
//   errorHandler,
//   async (req, res) => {
//     if (req.file) {
//       const newFilename = `${
//         req.file.originalname.split('.')[0]
//       }-${Date.now()}${path.extname(req.file.originalname)}`;

//       await sharp(req.file.buffer)
//         .resize({ width: 640, height: 640 })
//         .toFile('uploads/schools/resized-' + newFilename);

//       res.send(`/uploads/schools/resized-${newFilename}`);
//     }
//   }
// );

// router.post(
//   '/schools',
//   upload.single('image'),
//   errorHandler,
//   async (req, res) => {
//     if (req.file) {
//       const newFilename = `${
//         req.file.originalname.split('.')[0]
//       }-${Date.now()}${path.extname(req.file.originalname)}`;

//       await sharp(req.file.buffer)
//         .resize({ width: 640, height: 640 })
//         .toFile('uploads/sizeguides/resized-' + newFilename);

//       res.send(`/uploads/sizeguides/resized-${newFilename}`);
//     }
//   }
// );

// router.get('/images', (req, res) => {
//   const __dirname = path.resolve();
//   const imagesFolder = path.join(__dirname, '/uploads/');

//   const images = [];

//   const dirents = fs.readdirSync(imagesFolder, { withFileTypes: true });
//   const files = dirents
//     .filter((dirent) => dirent.isFile())
//     .map((dirent) => dirent.name);

//   files.sort(
//     (a, b) =>
//       fs.statSync(imagesFolder + b).mtime.getTime() -
//       fs.statSync(imagesFolder + a).mtime.getTime()
//   );

//   files.forEach((file) => {
//     images.push({ url: `\\uploads\\${file}`, name: file });
//   });
//   let currentPage = req.query.page || 1;
//   const indexOfLastImage = currentPage * imagesPerPage;
//   const indexOfFirstImage = indexOfLastImage - imagesPerPage;
//   const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);
//   const pages = Math.ceil(images.length / imagesPerPage);

//   res.send({ images: currentImages, pages: pages });
// });

// router.get('/images/products', (req, res) => {
//   const __dirname = path.resolve();
//   const imagesFolder = path.join(__dirname, '/uploads/products/');

//   const images = [];

//   const files = fs.readdirSync(imagesFolder);

//   files.sort(
//     (a, b) =>
//       fs.statSync(imagesFolder + b).mtime.getTime() -
//       fs.statSync(imagesFolder + a).mtime.getTime()
//   );

//   files.forEach((file) => {
//     images.push({ url: `\\uploads\\products\\${file}`, name: file });
//   });

//   const indexOfLastImage = currentPage * imagesPerPage;
//   const indexOfFirstImage = indexOfLastImage - imagesPerPage;
//   const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);
//   const pages = Math.ceil(images.length / imagesPerPage);
//   console.log(pages);

//   res.send({ images: currentImages, pages: pages });
// });

// router.get('/images/schools', (req, res) => {
//   const __dirname = path.resolve();
//   const imagesFolder = path.join(__dirname, '/uploads/schools/');

//   const images = [];

//   const files = fs.readdirSync(imagesFolder);

//   files.sort(
//     (a, b) =>
//       fs.statSync(imagesFolder + b).mtime.getTime() -
//       fs.statSync(imagesFolder + a).mtime.getTime()
//   );

//   files.forEach((file) => {
//     images.push({ url: `\\uploads\\schools\\${file}`, name: file });
//   });
//   const indexOfLastImage = currentPage * imagesPerPage;
//   const indexOfFirstImage = indexOfLastImage - imagesPerPage;
//   const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);
//   const pages = Math.ceil(images.length / imagesPerPage);
//   console.log(pages);

//   res.send({ images: currentImages, pages: pages });
// });
export default router;
