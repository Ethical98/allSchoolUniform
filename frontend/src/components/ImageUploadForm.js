import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import Message from './Message';
import UploadProgressBar from './UploadProgressBar';

const ImageUploadForm = ({ setUrl, product, school, extra }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const types = ['image/png', 'image/jpg', 'image/jpeg'];

  const uploadFileHandler = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && types.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select an image file (png ,jpg or jpeg)');
    }
  };

  return (
    <>
      <Form className='image-upload-form'>
        {/* <Form.Group
          controlId='formFile'
          className='image-upload-form-group mb-3'
        >
          <Form.Control
            className='image-upload-input'
            type='file'
            custom={true}
            onChange={uploadFileHandler}
          />
          <span>+</span>
        </Form.Group> */}
        <label className='image-upload-form-group mb-3'>
          <input
            className='image-upload-input'
            type='file'
            onChange={uploadFileHandler}
          />
          <span>+</span>
        </label>
        <div className='output-image'>
          {error && <Message variant='danger'>{error}</Message>}
          {file && <div>{file.name}</div>}
          {file && (
            <UploadProgressBar
              file={file}
              setFile={setFile}
              setUrl={setUrl}
              product={product}
              school={school}
              extra={extra}
            />
          )}
        </div>
      </Form>
    </>
  );
};

export default ImageUploadForm;
