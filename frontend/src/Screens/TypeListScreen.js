import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { Image, Row, Col, Button } from 'react-bootstrap';
import { logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import { deleteType, listAllTypes } from '../actions/typeActions';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';

const TypeListScreen = ({ history }) => {
  const dispatch = useDispatch();

  const typeListAll = useSelector((state) => state.typeListAll);
  const { loading, masterTypes, error } = typeListAll;

  const typeDelete = useSelector((state) => state.typeDelete);
  const { success: successDelete } = typeDelete;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const columns = [
    {
      title: '#',
      field: 'tableData.id',

      render: (rowData) => rowData.tableData.id + 1,
    },
    { title: 'Type', field: 'type' },
    {
      title: 'Image',
      field: 'image',
      render: (item) => (
        <Image
          src={item.image}
          alt={item.type}
          style={{ width: '5vw' }}
          fluid
          rounded
        />
      ),
    },
    {
      title: 'Size Guide',
      field: 'sizeGuide',
      render: (item) => (
        <Image
          src={item.sizeGuide}
          alt={item.type}
          style={{ width: '5vw' }}
          fluid
          rounded
        />
      ),
    },
    {
      title: 'Size Chart',
      field: 'sizeChart',
      render: (item) => (
        <Image
          src={item.sizeChart}
          alt={item.type}
          style={{ width: '5vw' }}
          fluid
          rounded
        />
      ),
    },
  ];

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
    if (userInfo && userInfo.isAdmin) {
      dispatch(listAllTypes());
    } else {
      dispatch(logout());
      history.push('/login');
    }
  }, [dispatch, history, userInfo, successDelete]);

  return (
    <AdminPageLayout>
      <Meta
        title={'Product Type List - AllSchoolUniform'}
        description={'Product List Page'}
      />
      <Row className='align-items-center'>
        <Col>
          <h1>TYPES</h1>
        </Col>
        <Col>
          <Button
            variant='dark'
            className='my-3 float-end '
            onClick={() => history.push('/admin/type/create')}
          >
            <i className='fas fa-plus' /> ADD TYPE
          </Button>
        </Col>
      </Row>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <MaterialTable
            title='Types'
            columns={columns}
            data={masterTypes && masterTypes}
            options={{
              paging: false,
              actionsColumnIndex: -1,
            }}
            editable={{
              onRowDelete: (oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    dispatch(deleteType(oldData._id));
                    resolve();
                  }, 1000);
                }),
            }}
            actions={[
              {
                icon: 'edit',
                tooltip: 'Edit',
                onClick: (event, rowData) =>
                  history.push(`/admin/type/${rowData._id}/edit`),
              },
            ]}
          />
        </>
      )}
    </AdminPageLayout>
  );
};

export default TypeListScreen;
