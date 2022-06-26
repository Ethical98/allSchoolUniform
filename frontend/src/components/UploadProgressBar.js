import React, { useEffect } from 'react';
import { uploadProductImage } from '../actions/productActions';
import './css/UploadProgressBar.css';
import { useDispatch, useSelector } from 'react-redux';
import { uploadSchoolImage } from '../actions/schoolActions';
import { uploadTypeImage } from '../actions/typeActions';

const UploadProgressBar = ({ file, setFile, product, school, extra, typeImageOne, typeImageTwo, typeImageThree }) => {
    const dispatch = useDispatch();
    const productImageUpload = useSelector(state => state.productImageUpload);
    const { progress, url } = productImageUpload;
    const schoolImageUpload = useSelector(state => state.schoolImageUpload);
    const { progress: schoolImageUploadProgress, url: schoolImageUrl } = schoolImageUpload;
    const typeImageUpload = useSelector(state => state.typeImageUpload);
    const { progress: typeImageUploadProgress, imageOneUrl, imageTwoUrl, imageThreeUrl } = typeImageUpload;

    useEffect(() => {
        if (url || schoolImageUrl || imageOneUrl || imageTwoUrl || imageThreeUrl) {
            setFile(null);
        }
    }, [url, schoolImageUrl, setFile, imageOneUrl, imageTwoUrl, imageThreeUrl]);

    useEffect(() => {
        if (product) {
            dispatch(uploadProductImage(file));
        } else if (school) {
            dispatch(uploadSchoolImage(file));
        } else if (typeImageOne || typeImageTwo || typeImageThree) {
            dispatch(uploadTypeImage(file, typeImageOne, typeImageTwo, typeImageThree));
        }
    }, [file, product, school, dispatch, typeImageOne, typeImageTwo, typeImageThree]);

    return (
        <div
            className="image-upload-progress-bar"
            style={{
                width: progress
                    ? progress
                    : schoolImageUploadProgress
                        ? schoolImageUploadProgress
                        : typeImageUploadProgress && typeImageUploadProgress + '%'
            }}
        ></div>
    );
};

export default UploadProgressBar;
