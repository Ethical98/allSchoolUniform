import { useState, useEffect } from 'react';
import axios from 'axios';

const useStorage = (file, product, school, extra) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState(null);

  const baseUrl = '/api/upload/';
  const suffixUrl = product ? 'products' : school ? 'schools' : 'extras';

  useEffect(() => {
    (async () => {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: ({ total, loaded }) => {
            let percentage = (loaded / total) * 100;
            setProgress(percentage);
          },
        };

        const { data } = await axios.post(
          baseUrl + suffixUrl,
          formData,
          config
        );
        setUrl(data);
      } catch (error) {
        setError(error);
      }
    })();
  }, [file]);

  return { progress, url, error };
};

export default useStorage;
