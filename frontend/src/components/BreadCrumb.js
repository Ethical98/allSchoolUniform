import React from 'react';
import { Breadcrumb } from 'react-bootstrap';

const BreadCrumb = () => {
  return (
    <div>
      <Breadcrumb>
        <Breadcrumb.Item href='#'>Home</Breadcrumb.Item>
        {/* <Breadcrumb.Item href='https://getbootstrap.com/docs/4.0/components/breadcrumb/'>
          Library
        </Breadcrumb.Item> */}
        <Breadcrumb.Item active>School Name</Breadcrumb.Item>
      </Breadcrumb>
    </div>
  );
};

export default BreadCrumb;
