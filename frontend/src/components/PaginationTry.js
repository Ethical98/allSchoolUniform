import React from 'react';
import { Pagination } from 'react-bootstrap';

const PaginationTry = ({ pages, page, changePage }) => {

  return (
    pages > 1 && (
      <Pagination>
        {[...Array(pages).keys()].map((x) => (
          <Pagination.Item
            key={x}
            active={x + 1 === page}
            onClick={() => changePage(x + 1)}
          >
            {x + 1}
          </Pagination.Item>
        ))}
      </Pagination>
    )
  );
};

export default PaginationTry;
