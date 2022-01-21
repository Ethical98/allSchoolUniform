import React from 'react';
import ImageGrid from '../components/ImageGrid';
import ImageUploadForm from '../components/ImageUploadForm';

const ImageUploader = ({
  setUrl,
  url,
  product,
  school,
  extra,
  typeImageOne,
  typeImageTwo,
  typeImageThree,
}) => {
  return (
    <>
      <ImageUploadForm
        setUrl={setUrl}
        product={product}
        school={school}
        extra={extra}
        typeImageOne={typeImageOne}
        typeImageTwo={typeImageTwo}
        typeImageThree={typeImageThree}
      />
      <ImageGrid
        url={url}
        typeImageOne={typeImageOne}
        typeImageTwo={typeImageTwo}
        typeImageThree={typeImageThree}
      />
    </>
  );
};

export default ImageUploader;
