import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import './css/BreadCrumb.css';

const BreadCrumb = () => {
  const location = useLocation();
  const pathArray = location.pathname.split('/');
  pathArray.shift();
  const Items = pathArray.map((x) => {
    return x && x.charAt(0).toUpperCase() + x.slice(1);
  });

  const url = location.pathname;

  return (
    <Breadcrumb className='mb-3 navigationCrumb btn-outline-light'>
      <Breadcrumb.Item href='/'>Home</Breadcrumb.Item>
      {Items.map((x) => {
        return (
          <Breadcrumb.Item
            key={x}
            href={Items[Items.length - 1] === x ? url : `/${x}`}
          >
            {x}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
};

export default BreadCrumb;
