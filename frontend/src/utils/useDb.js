// import { useState, useEffect } from 'react';
// import axios from 'axios';


// const useDb = (url, product, school, extra, currentPage) => {
//   const [images, setImages] = useState([]);
//   const [productImages, setProductImages] = useState([]);
//   // const [schoolImages, setSchoolImages] = useState([]);
//   const [totalSchoolImagePages, setTotalSchoolImagePages] = useState(1);
//   const [totalProductImagePages, setTotalProductImagePages] = useState(1);
//   const [totalUploadImagePages, setTotalUploadImagePages] = useState(1);
//   const [loading, setLoading] = useState(false);

//   const baseUrl = '/api/upload/images';

//   const config = {
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const {
//           data: { images: uploads, pages: uploadPages },
//         } = await axios.get(baseUrl + `?page=${currentPage}`, config);
//         setImages([...uploads]);
//         setTotalUploadImagePages(uploadPages);
//         const {
//           data: { images: products, pages: productPages },
//         } = await axios.get(baseUrl + '/products', config);
//         setProductImages([...products]);
    
//         setTotalProductImagePages(productPages);
//         const {
//           data: { images: schools, pages: schoolPages },
//         } = await axios.get(baseUrl + '/schools', config);
//         setSchoolImages([...schools]);
     
//         setTotalSchoolImagePages(schoolPages);
//         setLoading(false);
//       } catch (error) {
//         console.log(error);
//       }
//     })();
//   }, [url, currentPage]);
//   return {
//     images,
//     productImages,
//     totalProductImagePages,
//     totalSchoolImagePages,
//     totalUploadImagePages,
//   };
// };

// export default useDb;
