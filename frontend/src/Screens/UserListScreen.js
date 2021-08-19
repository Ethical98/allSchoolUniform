import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { deleteUser, listUsers, logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import Paginate from '../components/Paginate';

const UserListScreen = ({ history, location }) => {
  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const pageNumber = params.page ? params.page : 1;

  const dispatch = useDispatch();

  const userList = useSelector((state) => state.userList);
  const { loading, users, error, pages, page } = userList;

  const userDelete = useSelector((state) => state.userDelete);
  const { success: successDelete } = userDelete;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const columns = [
    {
      title: '#',
      field: 'tableData.id',

      render: (rowData) => rowData.tableData.id + 1,
    },
    {
      title: 'Name',
      field: 'name',
    },
    {
      title: 'Email',
      field: 'email',
    },
    {
      title: 'Phone',
      field: 'phone',
    },
    {
      title: 'IsAdmin',
      field: 'isAdmin',

      render: (item) =>
        item.isAdmin ? (
          <i className='fas fa-check' style={{ color: 'green' }}></i>
        ) : (
          <i className='fas fa-times' style={{ color: 'red' }}></i>
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
      dispatch(listUsers(pageNumber));
    } else {
      dispatch(logout());
      history.push('/login');
    }
  }, [dispatch, history, successDelete, userInfo, pageNumber]);

  return (
    <>
      <h1>USERS</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <MaterialTable
            title='Users'
            columns={columns}
            data={users && users}
            options={{
              rowStyle: {
                color: 'black',
              },
              paging: false,
              actionsColumnIndex: -1,
            }}
            editable={{
              isDeleteHidden: (rowData) => rowData.name === 'Admin User',
              isEditHidden: (rowData) => rowData.name === 'Admin User',
              onRowDelete: (oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    dispatch(deleteUser(oldData._id));
                    resolve();
                  }, 1000);
                }),
            }}
            actions={[
              (rowData) => ({
                icon: 'edit',
                tooltip: 'Edit',
                onClick: (event, rowData) =>
                  history.push(`/admin/user/${rowData._id}/edit`),
                disabled: rowData.name === 'Admin User',
              }),
            ]}
          />
          <Paginate pages={pages} page={page} isAdmin={true} users={true} />
        </>
      )}
    </>
  );
};

export default UserListScreen;
