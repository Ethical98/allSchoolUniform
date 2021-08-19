import React from 'react';
import { Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Paginate = ({
  orderEdit = false,
  pages,
  page,
  isAdmin = false,
  keyword = '',
  category = '',
  season = '',
  standard = [],
  orderId = '',
  orders = false,
  products = false,
  users = false,
  schools = false,
}) => {
  return (
    pages > 1 && (
      <Pagination className='float-end my-3'>
        {[...Array(pages).keys()].map((x) => (
          <LinkContainer
            key={x + 1}
            to={
              !isAdmin && products
                ? keyword
                  ? `/products?search=${keyword}&page=${x + 1}`
                  : category && season && standard.length > 0
                  ? `/products?season=${season}&category=${category}&class=${standard}&page=${
                      x + 1
                    }`
                  : category && season
                  ? `/products?season=${season}&category=${category}&page=${
                      x + 1
                    }`
                  : category && standard.length > 0
                  ? `/products?category=${category}&class=${standard}&page=${
                      x + 1
                    }`
                  : season && standard.length > 0
                  ? `/products?season=${season}&class=${standard}&page=${x + 1}`
                  : season
                  ? `/products?season=${season}&page=${x + 1}`
                  : category
                  ? `/products?category=${category}&page=${x + 1}`
                  : standard.length > 0
                  ? `/products?class=${standard}&page=${x + 1}`
                  : `/products?page=${x + 1}`
                : isAdmin && products
                ? `/admin/productlist?page=${x + 1}`
                : isAdmin && schools
                ? `/admin/schoollist?page=${x + 1}`
                : isAdmin && orders
                ? `/admin/orderlist?page=${x + 1}`
                : isAdmin && users
                ? `/admin/userlist?page=${x + 1}`
                : `/admin/order/${orderId}/edit?page=${x + 1}`
            }
          >
            <Pagination.Item active={x + 1 === page}>{x + 1}</Pagination.Item>
          </LinkContainer>
        ))}
      </Pagination>
    )
  );
};

export default Paginate;
