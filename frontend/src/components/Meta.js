import React from 'react';
import { Helmet } from 'react-helmet';

const Meta = ({ title, description, keywords }) => {
  console.log(description);
  return (
    <div>
      <Helmet>
        <title>{title}</title>

        <meta name='description' content={description} />
        <meta name='keyword' content={keywords} />
      </Helmet>
    </div>
  );
};

Meta.defaultProps = {
  title: 'Welcome To AllSchoolUniform',
  description: 'Buy School Uniforms Online',
  keywords: 'uniform,school,buy,cheap,Asu',
};

export default Meta;
