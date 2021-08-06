import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { deleteUser, listUsers, logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import MaterialButton from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
  dialog: {
    width: '40vw',
  },
});

const UserListScreen = ({ history }) => {
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

  const [deleteId, setDeleteId] = useState('');

  const userList = useSelector((state) => state.userList);
  const { loading, users, error } = userList;

  const userDelete = useSelector((state) => state.userDelete);
  const { success: successDelete } = userDelete;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const classes = useStyles();

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
      dispatch(listUsers());
    } else {
      dispatch(logout());
      history.push('/login');
    }
  }, [dispatch, history, successDelete, userInfo]);

  const deleteHandler = (id) => {
    setDeleteId(id);
    setOpen(true);
  };

  const confirmDeleteHandler = () => {
    setOpen(false);

    dispatch(deleteUser(deleteId));
  };

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

              actionsColumnIndex: -1,
            }}
            actions={[
              {
                icon: 'edit',
                tooltip: 'Edit',
                onClick: (event, rowData) =>
                  history.push(`/admin/user/${rowData._id}/edit`),
              },

              {
                icon: 'delete',
                tooltip: 'Delete',
                onClick: (event, rowData) => deleteHandler(rowData._id),
              },
            ]}
          />
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title' className={classes.dialog}>
              <span className='text-danger'>{'Delete User'}</span>
            </DialogTitle>
            <DialogContent>
              <DialogContentText id='alert-dialog-description'>
                Are You Sure?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <MaterialButton
                onClick={() => {
                  setOpen(false);
                }}
                color='primary'
              >
                No
              </MaterialButton>
              <MaterialButton
                onClick={confirmDeleteHandler}
                color='primary'
                autoFocus
              >
                Yes
              </MaterialButton>
            </DialogActions>
          </Dialog>
        </>

        // <Table striped bordered hover responsive className='table-sm'>
        //   <thead>
        //     <tr>
        //       <th>S.NO.</th>
        //       <th>NAME</th>
        //       <th>EMAIL</th>
        //       <th>PHONE</th>
        //       <th>ADMIN</th>
        //       <th>SAVED ADDRESS</th>
        //       <th></th>
        //     </tr>
        //   </thead>
        //   <tbody>
        //     {users.map((user, index) => (
        //       <tr key={user._id}>
        //         <td>{index + 1}</td>
        //         <td>{user.name}</td>
        //         <td>
        //           <a href={`mailto:${user.email}`}>{user.email}</a>
        //         </td>
        //         <td>{user.phone}</td>
        //         <td>
        //           {user.isAdmin ? (
        //             <i className='fas fa-check' style={{ color: 'green' }}></i>
        //           ) : (
        //             <i className='fas fa-times' style={{ color: 'red' }}></i>
        //           )}
        //         </td>
        //         <td>
        //           {user.savedAddress.length > 0 ? (
        //             user.savedAddress.map((x, index) => (
        //               <li key={index}>
        //                 {x.address}
        //                 <br />
        //                 {x.city}
        //                 <br />
        //                 {x.postalCode}
        //                 <br />
        //                 {x.country}
        //               </li>
        //             ))
        //           ) : (
        //             <i className='fas fa-times' style={{ color: 'red' }}></i>
        //           )}
        //         </td>

        //         <td>
        //           <LinkContainer to={`/admin/user/${user._id}/edit`}>
        //             <Button variant='light' className='btn-sm mx-2'>
        //               <i className='fas fa-edit'></i>
        //             </Button>
        //           </LinkContainer>
        //           <Button
        //             variant='danger'
        //             className='btn-sm mx-2'
        //             onClick={() => deleteHandler(user._id)}
        //           >
        //             <i className='fas fa-trash'></i>
        //           </Button>
        //         </td>
        //       </tr>
        //     ))}
        //   </tbody>
        // </Table>
      )}
    </>
  );
};

export default UserListScreen;
