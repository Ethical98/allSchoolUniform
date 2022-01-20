import React, { useEffect } from 'react';
import { uploadProductImage } from '../actions/productActions';
import './css/UploadProgressBar.css';
import { useDispatch, useSelector } from 'react-redux';
import { uploadSchoolImage } from '../actions/schoolActions';

const UploadProgressBar = ({ file, setFile, product, school, extra }) => {
  const dispatch = useDispatch();
  const productImageUpload = useSelector((state) => state.productImageUpload);
  const { progress, url } = productImageUpload;
  const schoolImageUpload = useSelector((state) => state.schoolImageUpload);
  const { url: schoolImageUrl } = schoolImageUpload;
  useEffect(() => {
    if (url || schoolImageUrl) {
      setFile(null);
    }
  }, [url, schoolImageUrl, setFile]);

  useEffect(() => {
    if (product) dispatch(uploadProductImage(file));
    else if (school) dispatch(uploadSchoolImage(file));
  }, [file, product, school, dispatch]);

  return (
    <div
      className='image-upload-progress-bar'
      style={{ width: progress + '%' }}
    ></div>
  );
};

export default UploadProgressBar;
