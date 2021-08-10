import React from 'react';
import { Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const LocalPagination = ({
  productsPerPage,
  totalProducts,
  paging,
  currentPage,
}) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalProducts / productsPerPage); i++) {
    pageNumbers.push(i);
  }
  return (
    pageNumbers.length > 1 && (
      <Pagination className='float-end my-3'>
        {pageNumbers.map((number) => (
          <Pagination.Item
            onClick={() => paging(number)}
            active={number === currentPage}
          >
            {number}
          </Pagination.Item>
        ))}
      </Pagination>
    )
  );
};

export default LocalPagination;
