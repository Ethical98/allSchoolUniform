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
  school = '',
}) => {
  return (
    pages > 1 && (
      <Pagination className='float-end my-3'>
        {[...Array(pages).keys()].map((x) => (
          <LinkContainer
            key={x + 1}
            to={
              !isAdmin && products
                ? keyword &&
                  category.length > 0 &&
                  season.length > 0 &&
                  standard.length > 0 &&
                  keyword
                  ? `/products?search=${keyword}&season=${season}&category=${category}&class=${standard}&page=${
                      x + 1
                    }`
                  : category.length > 0 && season.length > 0 && keyword
                  ? `/products?search=${keyword}&season=${season}&category=${category}}&page=${
                      x + 1
                    }`
                  : category.length > 0 && standard.length > 0 && keyword
                  ? `/products?search=${keyword}&category=${category}&class=${standard}&page=${
                      x + 1
                    }`
                  : season.length > 0 && standard.length > 0 && keyword
                  ? `/products?search=${keyword}&season=${season}&class=${standard}&page=${
                      x + 1
                    }`
                  : season.length > 0 && keyword
                  ? `/products?search=${keyword}&season=${season}&page=${x + 1}`
                  : category.length > 0 && keyword
                  ? `/products?search=${keyword}&category=${category}&page=${
                      x + 1
                    }`
                  : standard.length > 0 && keyword
                  ? `/products?search=${keyword}&class=${standard}&page=${
                      x + 1
                    }`
                  : keyword &&
                    category.length > 0 &&
                    season.length > 0 &&
                    standard.length > 0 &&
                    school
                  ? `/products?season=${season}&category=${category}&class=${standard}&school=${school}&page=${
                      x + 1
                    }`
                  : category.length > 0 && season.length > 0 && school
                  ? `/products?search=${keyword}&season=${season}&category=${category}&school=${school}&page=${
                      x + 1
                    }`
                  : category.length > 0 && standard.length > 0 && school
                  ? `/products?search=${keyword}&category=${category}&class=${standard}&school=${school}&page=${
                      x + 1
                    }`
                  : season.length > 0 && standard.length > 0 && school
                  ? `/products?search=${keyword}&season=${season}&class=${standard}&school=${school}&page=${
                      x + 1
                    }`
                  : season.length > 0 && school
                  ? `/products?search=${keyword}&season=${season}&school=${school}&page=${
                      x + 1
                    }`
                  : category.length > 0 && school
                  ? `/products?search=${keyword}&category=${category}&school=${school}&page=${
                      x + 1
                    }`
                  : standard.length > 0 && school
                  ? `/products?search=${keyword}&class=${standard}&school=${school}&page=${
                      x + 1
                    }`
                  : keyword
                  ? `/products?search=${keyword}&page=${x + 1}`
                  : school
                  ? `/products/schools/${school}?page=${x + 1}`
                  : category.length > 0 &&
                    season.length > 0 &&
                    standard.length > 0
                  ? `/products?season=${season}&category=${category}&class=${standard}&page=${
                      x + 1
                    }`
                  : category.length > 0 && season.length > 0
                  ? `/products?season=${season}&category=${category}&page=${
                      x + 1
                    }`
                  : category.length > 0 && standard.length > 0
                  ? `/products?category=${category}&class=${standard}&page=${
                      x + 1
                    }`
                  : season.length > 0 && standard.length > 0
                  ? `/products?season=${season}&class=${standard}&page=${x + 1}`
                  : season.length > 0
                  ? `/products?season=${season}&page=${x + 1}`
                  : category.length > 0
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
