import React from 'react';
import ImageGrid from '../components/ImageGrid';
import ImageUploadForm from '../components/ImageUploadForm';

const ImageUploader = ({ setUrl, url, product, school, extra }) => {
  return (
    <>
      <ImageUploadForm
        setUrl={setUrl}
        product={product}
        school={school}
        extra={extra}
      />
      <ImageGrid url={url} />
    </>
  );
};

export default ImageUploader;
