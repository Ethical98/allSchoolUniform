import React, { useState, useEffect } from 'react';
import { Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Paginate = ({
    addProduct = false,
    orderEdit = false,
    pages,
    page,
    editProduct = false,
    productId = '',
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
    school = ''
}) => {
    const [pageNumberLimit, setPageNumberLimit] = useState(5);
    const [maxPageNumberLimit, setMaxPageNumberLimit] = useState(5);
    const [minPageNumberLimit, setMinPageNumberLimit] = useState(0);

    useEffect(() => {
        if (page > maxPageNumberLimit) {
            setMaxPageNumberLimit(maxPageNumberLimit + pageNumberLimit);
            setMinPageNumberLimit(minPageNumberLimit + pageNumberLimit);
        }
    }, [page, pageNumberLimit, minPageNumberLimit, maxPageNumberLimit]);

    useEffect(() => {
        if ((page - 1) % pageNumberLimit === 0) {
            setMaxPageNumberLimit(maxPageNumberLimit - pageNumberLimit);
            setMinPageNumberLimit(minPageNumberLimit - pageNumberLimit);
        }
        // eslint-disable-next-line
    }, [page]);

    const href = (prev, next, regular, first, last, x) => {
        return !isAdmin && products
            ? keyword && category.length > 0 && season.length > 0 && standard.length > 0 && keyword
                ? `/products?search=${keyword}&season=${season}&category=${category}&class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && season.length > 0 && keyword
                ? `/products?search=${keyword}&season=${season}&category=${category}}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && standard.length > 0 && keyword
                ? `/products?search=${keyword}&category=${category}&class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : season.length > 0 && standard.length > 0 && keyword
                ? `/products?search=${keyword}&season=${season}&class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : season.length > 0 && keyword
                ? `/products?search=${keyword}&season=${season}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && keyword
                ? `/products?search=${keyword}&category=${category}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : standard.length > 0 && keyword
                ? `/products?search=${keyword}&class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : keyword && category.length > 0 && season.length > 0 && standard.length > 0 && school
                ? `/products?season=${season}&category=${category}&class=${standard}&school=${school}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && season.length > 0 && school
                ? `/products?season=${season}&category=${category}&school=${school}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && standard.length > 0 && school
                ? `/products?category=${category}&class=${standard}&school=${school}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : season.length > 0 && standard.length > 0 && school
                ? `/products?season=${season}&class=${standard}&school=${school}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : season.length > 0 && school
                ? `/products?season=${season}&school=${school}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && school
                ? `/products?category=${category}&school=${school}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : standard.length > 0 && school
                ? `/products?class=${standard}&school=${school}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : keyword
                ? `/products?search=${keyword}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : school
                ? `/products/schools/${school}?page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && season.length > 0 && standard.length > 0
                ? `/products?season=${season}&category=${category}&class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && season.length > 0
                ? `/products?season=${season}&category=${category}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0 && standard.length > 0
                ? `/products?category=${category}&class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : season.length > 0 && standard.length > 0
                ? `/products?season=${season}&class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : season.length > 0
                ? `/products?season=${season}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : category.length > 0
                ? `/products?category=${category}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : standard.length > 0
                ? `/products?class=${standard}&page=${
                      prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
                  }`
                : `/products?page=${prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1}`
            : isAdmin && products
            ? `/admin/productlist?page=${prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1}`
            : isAdmin && schools
            ? `/admin/schoollist?page=${prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1}`
            : isAdmin && orders
            ? `/admin/orderlist?page=${prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1}`
            : isAdmin && users
            ? `/admin/userlist?page=${prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1}`
            : addProduct && isAdmin
            ? `/admin/product/create?page=${prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1}`
            : editProduct && isAdmin
            ? `/admin/product/${productId}/edit?page=${
                  prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
              }`
            : `/admin/order/${orderId}/edit?page=${
                  prev ? page - 1 : next ? page + 1 : last ? pages : regular ? x + 1 : 1
              }`;
    };

    return (
        <>
            {pages > 1 && (
                <Pagination className="float-end my-5">
                    {page > pageNumberLimit && (
                        <LinkContainer to={href(false, false, false, true, false)}>
                            <Pagination.First />
                        </LinkContainer>
                    )}
                    {page > pageNumberLimit && (
                        <LinkContainer to={href(true, false, false, false, false)}>
                            <Pagination.Prev />
                        </LinkContainer>
                    )}

                    {[...Array(pages).keys()].map(
                        (x, index) =>
                            x + 1 < maxPageNumberLimit + 1 &&
                            x + 1 > minPageNumberLimit && (
                                <LinkContainer key={index} to={href(false, false, true, false, false, x)}>
                                    <Pagination.Item active={x + 1 === page}>{x + 1}</Pagination.Item>
                                </LinkContainer>
                            )
                    )}

                    {page < pages && pages > pageNumberLimit && (
                        <LinkContainer to={href(false, true, false, false)}>
                            <Pagination.Next />
                        </LinkContainer>
                    )}
                    {page < pages && pages > pageNumberLimit && (
                        <LinkContainer to={href(false, false, false, false, true)}>
                            <Pagination.Last />
                        </LinkContainer>
                    )}
                </Pagination>
            )}
        </>
    );
};

export default Paginate;
