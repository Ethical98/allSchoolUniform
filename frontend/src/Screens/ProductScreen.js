import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import Product from '../components/Product';
import { listProducts } from '../actions/productActions';
import { logout } from '../actions/userActions';
import Paginate from '../components/Paginate';
import jsonwebtoken from 'jsonwebtoken';
import Meta from '../components/Meta';
import Accordion from '../components/Accordion';
import PageLayout from '../components/PageLayout';
import BreadCrumb from '../components/BreadCrumb';
import { split, startCase } from 'lodash';

const ProductScreen = ({ history, location, match }) => {
    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const school = match.params.selectedschool ? match.params.selectedschool : params.school;

    const category = params.category ? params.category : '';
    const season = params.season ? params.season : '';
    const standard = params.class ? params.class : '';
    const pageNumber = params.page ? params.page : 1;
    const keyword = params.search ? params.search : '';

    const productList = useSelector((state) => state.productList);
    const { loading, error, products, pages, page } = productList;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const dispatch = useDispatch();
    const formattedSchool = startCase(split(school, '-'));

    useEffect(() => {
        dispatch(
            listProducts(
                keyword,
                pageNumber,
                category.split(',').join('|'),
                season.split(',').join('|'),
                standard.split(',').join('|'),
                formattedSchool
            )
        );
    }, [dispatch, keyword, pageNumber, category, season, standard, school]);

    useEffect(() => {
        if (userInfo && userInfo.token) {
            jsonwebtoken.verify(userInfo.token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
                if (err) {
                    dispatch(logout());
                    history.push('/login');
                }
            });
        }
    }, [dispatch, userInfo, history]);

    return (
        <PageLayout>
            <Meta
                title={`${school} Products - AllschoolUniform`}
                description={`${school} Uniform Available at discounted rates`}
                keywords={`${school},${keyword},${season},${category}`}
                canonical={window.location.href}
            />
            <BreadCrumb />
            {/* {keyword && (
        <Link to='/' className='mb-3 btn btn-light'>
          Go Back
        </Link>
      )} */}
            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    <Row>
                        <Col sm={6} md={3}>
                            <Accordion />
                        </Col>
                        <Col sm={6} md={9}>
                            <Row>
                                {products.map(
                                    (product, index) =>
                                        product.isActive === true && (
                                            <Col sm={12} md={6} lg={4} xl={4} key={index}>
                                                <Product product={product} />
                                            </Col>
                                        )
                                )}
                            </Row>
                        </Col>
                    </Row>
                    <Paginate
                        pages={pages}
                        page={page}
                        keyword={keyword ? keyword : ''}
                        category={category ? category : ''}
                        season={season ? season : ''}
                        standard={standard ? standard : ''}
                        school={school ? school : ''}
                        products
                    />
                </>
            )}
        </PageLayout>
    );
};

export default ProductScreen;
