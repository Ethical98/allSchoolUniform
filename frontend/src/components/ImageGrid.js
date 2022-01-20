import React, { useState, useEffect } from 'react';
import { Image, Tabs, Tab } from 'react-bootstrap';
import './css/ImageGrid.css';
import PaginationTry from './PaginationTry';
import { useSelector, useDispatch } from 'react-redux';
import { listProductImages } from '../actions/productActions';
import { listSchoolImages } from '../actions/schoolActions';
import Loader from './Loader';
import Message from './Message';
import { PRODUCT_IMAGE_UPLOAD_SUCCESS } from '../constants/productConstants';
import { SCHOOL_IMAGE_UPLOAD_SUCCESS } from '../constants/schoolConstants';
import { TYPE_IMAGE_UPLOAD_SUCCESS } from '../constants/typeConstants';
import { listTypeImages } from '../actions/typeActions';

const ImageGrid = ({ product, school, extra }) => {
  const dispatch = useDispatch();
  const [currentProductImagePage, setCurrentProductImagePage] = useState(1);
  const [currentSchoolImagePage, setCurrentSchoolImagePage] = useState(1);
  const [currentTypeImagePage, setCurrentTypeImagePage] = useState(1);
  const [currentExtraImagePage, setCurrentExtraImagePage] = useState(1);

  const productImageList = useSelector((state) => state.productImageList);
  const {
    loading: productImagesLoading,
    productImages,
    productImagePages,
    error: productImagesError,
  } = productImageList;

  const productImageUpload = useSelector((state) => state.productImageUpload);
  const { url } = productImageUpload;

  const schoolImageList = useSelector((state) => state.schoolImageList);
  const {
    loading: schoolImagesLoading,
    schoolImages,
    schoolImagePages,
    error: schoolImagesError,
  } = schoolImageList;

  const schoolImageUpload = useSelector((state) => state.schoolImageUpload);
  const { url: schoolImageUrl } = schoolImageUpload;

  const typeImageList = useSelector((state) => state.typeImageList);
  const {
    loading: typeImagesLoading,
    typeImages,
    typeImagePages,
    error: typeImagesError,
  } = typeImageList;

  const typeImageUpload = useSelector((state) => state.typeImageUpload);
  const { url: typeImageUrl } = typeImageUpload;

  useEffect(() => {
    dispatch(listProductImages(currentProductImagePage));
  }, [currentProductImagePage, url, dispatch]);

  useEffect(() => {
    dispatch(listSchoolImages(currentSchoolImagePage));
  }, [currentSchoolImagePage, schoolImageUrl, dispatch]);

  useEffect(() => {
    dispatch(listTypeImages(currentTypeImagePage));
  }, [currentTypeImagePage, typeImageUrl, dispatch]);

  // const {
  //   images,

  //   totalUploadImagePages,
  // } = useDb(url, product, school, extra);

  return (
    <Tabs defaultActiveKey='uploads' className='mb-3'>
      <Tab eventKey='uploads' title='Uploads'>
        {/* <div className='img-grid'>
          {images &&
            images.map((image, index) => (
              <div className='img-wrap' key={index}>
                <Image className='w-50' src={image.url} alt={image.name} />
              </div>
            ))}
        </div>
        <PaginationTry
          page={currentProductImagePage}
          pages={totalUploadImagePages}
          changePage={setCurrentProductImagePage}
        /> */}
      </Tab>
      <Tab eventKey='products' title='Products'>
        <div className='img-grid'>
          {productImagesLoading ? (
            <Loader />
          ) : productImagesError ? (
            <Message variant={'danger'}>{productImagesError}</Message>
          ) : (
            productImages &&
            productImages.map((image, index) => (
              <div className='img-wrap' key={index}>
                <Image
                  onClick={() =>
                    dispatch({
                      type: PRODUCT_IMAGE_UPLOAD_SUCCESS,
                      payload: image.url,
                    })
                  }
                  className='w-50'
                  src={image.url}
                  alt={image.name}
                />
              </div>
            ))
          )}
        </div>
        <div>
          {productImagePages > 1 && (
            <PaginationTry
              page={currentProductImagePage}
              pages={productImagePages}
              changePage={setCurrentProductImagePage}
            />
          )}
        </div>
      </Tab>
      <Tab eventKey='school' title='Schools'>
        <div className='img-grid'>
          {schoolImagesLoading ? (
            <Loader />
          ) : schoolImagesError ? (
            <Message variant={'danger'}>{schoolImagesError}</Message>
          ) : (
            schoolImages &&
            schoolImages.map((image, index) => (
              <div className='img-wrap' key={index}>
                <Image
                  onClick={() =>
                    dispatch({
                      type: SCHOOL_IMAGE_UPLOAD_SUCCESS,
                      payload: image.url,
                    })
                  }
                  className='w-50'
                  src={image.url}
                  alt={image.name}
                />
              </div>
            ))
          )}
        </div>
        <div>
          {schoolImagePages > 1 && (
            <PaginationTry
              page={currentSchoolImagePage}
              pages={schoolImagePages}
              changePage={setCurrentSchoolImagePage}
            />
          )}
        </div>
      </Tab>
      <Tab eventKey='sizeguides' title='Size Guides'>
        <div className='img-grid'>
          {typeImagesLoading ? (
            <Loader />
          ) : typeImagesError ? (
            <Message variant={'danger'}>{typeImagesError}</Message>
          ) : (
            typeImages &&
            typeImages.map((image, index) => (
              <div className='img-wrap' key={index}>
                <Image
                  onClick={() =>
                    dispatch({
                      type: TYPE_IMAGE_UPLOAD_SUCCESS,
                      payload: image.url,
                    })
                  }
                  className='w-50'
                  src={image.url}
                  alt={image.name}
                />
              </div>
            ))
          )}
          <div>
            {typeImagePages > 1 && (
              <PaginationTry
                page={currentTypeImagePage}
                pages={typeImagePages}
                changePage={setCurrentTypeImagePage}
              />
            )}
          </div>
        </div>
      </Tab>
    </Tabs>
  );
};

export default ImageGrid;
