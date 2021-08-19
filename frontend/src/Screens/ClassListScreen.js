import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { Row, Col, Button } from 'react-bootstrap';
import { logout } from '../actions/userActions';
import MaterialTable from 'material-table';

import {
  createClass,
  deleteClass,
  listClasses,
  updateClass,
} from '../actions/classActions';

const ClassListScreen = ({ history, location }) => {
  const dispatch = useDispatch();

  const [classes, setClasses] = useState([]);

  const classList = useSelector((state) => state.classList);
  const { loading, error, masterClasses } = classList;

  const classDelete = useSelector((state) => state.classDelete);
  const { success: successDelete } = classDelete;

  const classCreate = useSelector((state) => state.classCreate);
  const { success: successCreate } = classCreate;

  const classUpdate = useSelector((state) => state.classUpdate);
  const { success: successUpdate } = classUpdate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const columns = [
    {
      title: '#',
      field: 'tableData.id',

      render: (rowData) => rowData.tableData.id + 1,
    },
    {
      title: 'Class',
      field: 'class',
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
      dispatch(listClasses());
    } else {
      dispatch(logout());
      history.push('/login');
    }
  }, [
    dispatch,
    history,
    userInfo,
    successDelete,
    successCreate,
    successUpdate,
  ]);

  useEffect(() => {
    if (masterClasses) {
      setClasses([...masterClasses]);
    }
  }, [masterClasses]);

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>CLASSES</h1>
        </Col>
        <Col>
          <Button
            variant='outline-primary'
            className='m-3  float-end'
            onClick={() => history.push('/admin/schoollist')}
          >
            SCHOOLS
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
            title='Classes'
            columns={columns}
            data={classes}
            options={{
              paging: false,
              actionsColumnIndex: -1,
            }}
            editable={{
              onRowAdd: (newData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    dispatch(createClass({ className: newData.class }));

                    resolve();
                  }, 1000);
                }),
              onRowUpdate: (newData, oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    dispatch(updateClass(newData));

                    resolve();
                  }, 1000);
                }),
              onRowDelete: (oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    dispatch(deleteClass(oldData._id));
                    resolve();
                  }, 1000);
                }),
            }}
          />
        </>
      )}
    </>
  );
};

export default ClassListScreen;
