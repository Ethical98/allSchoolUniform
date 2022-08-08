import React from 'react';
import { Helmet } from 'react-helmet';

const Meta = ({ title, description, keywords, canonical }) => {
    return (
        <div>
            <Helmet>
                <title>{title}</title>
                <meta name="title" content={title} />
                <meta name="description" content={description} />
                <meta name="keywords" content={keywords} />
                <meta name="robots" content={'index,follow'} />
                <link rel="canonical" href={canonical} />
            </Helmet>
        </div>
    );
};

Meta.defaultProps = {
    title: 'Welcome To AllSchoolUniform',
    description: 'Buy School Uniforms Online',
    keywords:
        'cheap,sell,buy,allschooluniform,new,buyback,unform,online,GD Goenka Public School,GD,schools,school,presidium,bal bharati public school,dps,kendriya vidyalya,dav,all,smart,air force,uniforms,public',
    canonical: 'https://allschooluniform.com'
};

export default Meta;
