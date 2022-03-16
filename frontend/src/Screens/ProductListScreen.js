import React, { useEffect, useState } from 'react';
import { Button, Row, Col, Image } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { listProducts, deleteProduct } from '../actions/productActions';
import { PRODUCT_CREATE_RESET } from '../constants/productConstants';
import { logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import { listSchoolNames } from '../actions/schoolActions';
import Paginate from '../components/Paginate';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

const ProductListScreen = ({ history, match, location }) => {
  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const pageNumber = params.page ? params.page : 1;

  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const productList = useSelector((state) => state.productList);
  const { loading, products, error, pages, page } = productList;

  const productDelete = useSelector((state) => state.productDelete);
  const { success: successDelete, error: errorDelete } = productDelete;

  const [school, setSchool] = useState('');

  const schoolNameList = useSelector((state) => state.schoolNameList);
  const { schoolNames } = schoolNameList;

  const columns = [
    {
      title: 'Name',
      field: 'name',
    },
    {
      title: 'Type',
      field: 'type',
    },
    {
      title: 'Category',
      field: 'category',
    },
    {
      title: 'Season',
      field: 'season',
    },
    {
      title: 'Image',
      field: 'image',
      render: (item) => (
        <Image
          src={item.image}
          alt={item.name}
          style={{ width: '5vw' }}
          fluid
          rounded
        />
      ),
    },
  ];

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }
  }, [history, userInfo]);

  useEffect(() => {
    if (userInfo && userInfo.token) {
      jsonwebtoken.verify(
        userInfo.token,
        process.env.REACT_APP_JWT_SECRET,
        (err, decoded) => {
          if (err) {
            dispatch(logout());
            history.push('/login');
          }
        }
      );
    }
  }, [dispatch, userInfo, history]);

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET });
    if (userInfo && !userInfo.isAdmin) {
      dispatch(logout());
      history.push('/login');
    } else {
      dispatch(listProducts('', pageNumber, '', '', '', school));
    }
  }, [dispatch, history, userInfo, successDelete, pageNumber, school]);

  const createProductHandler = () => {
    history.push('/admin/product/create');
  };

  useEffect(() => {
    if (schoolNames) {
      setOptions(schoolNames);
      setIsLoading(false);
    }
  }, [schoolNames]);

  const handleChange = (item) => {
    if (item.length > 0) {
      history.push('/admin/productlist/');
      setSchool(item[0].name);
    } else {
      setSchool('');
    }
  };

  const handleSearch = (query) => {
    setIsLoading(true);
    dispatch(listSchoolNames(query));
  };
  const filterBy = () => true;

  return (
    <AdminPageLayout>
      <Meta
        title={'Product List - AllSchoolUniform'}
        description={'List Product'}
      />
      <Row className='align-items-center'>
        <Col>
          <h1>PRODUCTS</h1>
        </Col>
        <Col className='float-end'>
          <div>
            <AsyncTypeahead
              clearButton={true}
              filterBy={filterBy}
              id='async-example'
              isLoading={isLoading}
              labelKey={'name'}
              minLength={3}
              onChange={(value) => handleChange(value)}
              onSearch={handleSearch}
              options={options}
              placeholder='Enter School Name..'
            />
          </div>
        </Col>
        <Col>
          <Button
            variant='dark'
            className='my-3 float-end '
            onClick={createProductHandler}
          >
            <i className='fas fa-plus' /> ADD PRODUCT
          </Button>
        </Col>
      </Row>

      {errorDelete && <Message varaint='danger'>{errorDelete}</Message>}
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <MaterialTable
            style={{ padding: '1%' }}
            title='Products'
            data={products}
            columns={columns}
            options={{
              rowStyle: {
                border: '1px solid grey',
              },
              actionsColumnIndex: -1,
              paging: false,
            }}
            editable={{
              onRowDelete: (oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    dispatch(deleteProduct(oldData._id));
                    resolve();
                  }, 1000);
                }),
            }}
            actions={[
              {
                icon: 'edit',
                tooltip: 'Edit',
                onClick: (event, rowData) =>
                  history.push(`/admin/product/${rowData._id}/edit`),
              },
            ]}
          />
          <Paginate pages={pages} page={page} isAdmin={true} products={true} />
        </>
      )}
    </AdminPageLayout>
  );
};

export default ProductListScreen;
