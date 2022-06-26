import React, { useState, useEffect } from 'react';
import { Pagination } from 'react-bootstrap';

const ImageUploadPagination = ({ pages, page, changePage }) => {
    const pageNumberLimit = 5;

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
    return (
        pages > 1 && (
            <Pagination>
                {page > pageNumberLimit && <Pagination.First onClick={() => changePage(1)} />}
                {page > pageNumberLimit && <Pagination.Prev onClick={() => changePage(page - 1)} />}
                {[...Array(pages).keys()].map(
                    x =>
                        x + 1 < maxPageNumberLimit + 1 &&
                        x + 1 > minPageNumberLimit && (
                            <Pagination.Item key={x} active={x + 1 === page} onClick={() => changePage(x + 1)}>
                                {x + 1}
                            </Pagination.Item>
                        )
                )}

                {page < pages && pages > pageNumberLimit && <Pagination.Next onClick={() => changePage(page + 1)} />}
                {page < pages && pages > pageNumberLimit && <Pagination.Last onClick={() => changePage(pages)} />}
            </Pagination>
        )
    );
};

export default ImageUploadPagination;
