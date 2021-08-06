import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { Image, Row, Col, Button } from 'react-bootstrap';
import { logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import MaterialButton from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/styles';
import { deleteSchool, listSchools } from '../actions/schoolActions';

const useStyles = makeStyles({
  dialog: {
    width: '40vw',
  },
});

const SchoolListScreen = ({ history }) => {
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

  const [deleteId, setDeleteId] = useState('');

  const schoolList = useSelector((state) => state.schoolList);
  const { loading, masterSchools, error } = schoolList;

  const schoolDelete = useSelector((state) => state.schoolDelete);
  const { success: successDelete } = schoolDelete;

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
      title: 'Logo',
      field: 'logo',
      render: (item) => (
        <Image
          src={item.logo}
          alt={item.name}
          style={{ width: '5vw' }}
          fluid
          rounded
        />
      ),
    },
    {
      title: 'Name',
      field: 'name',
    },
    {
      title: 'Address',
      field: 'address',
    },
    {
      title: 'Contact',
      field: 'contact',
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
      dispatch(listSchools());
    } else {
      dispatch(logout());
      history.push('/login');
    }
  }, [dispatch, history, userInfo, successDelete]);

  const deleteHandler = (id) => {
    setDeleteId(id);
    setOpen(true);
  };

  const confirmDeleteHandler = () => {
    setOpen(false);

    dispatch(deleteSchool(deleteId));
  };

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>SCHOOLS</h1>
        </Col>
        <Col>
          <Button
            variant='dark'
            className='my-3 float-end '
            onClick={() => history.push('/admin/school/create')}
          >
            <i className='fas fa-plus' /> ADD SCHOOL
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
            title='Schools'
            columns={columns}
            data={masterSchools && masterSchools}
            options={{
              rowStyle: {
                color: 'black',
              },
              onPageChange: (data) => {
                console.log(data);
              },
              paging: false,
              actionsColumnIndex: -1,
            }}
            actions={[
              {
                icon: 'edit',
                tooltip: 'Edit',
                onClick: (event, rowData) =>
                  history.push(`/admin/school/${rowData._id}/edit`),
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
              <span className='text-danger'>{'Delete School'}</span>
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
      )}
    </>
  );
};

export default SchoolListScreen;
