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
import {
  deleteType,
  listAllTypes,
  listTypeDetails,
} from '../actions/typeActions';

const useStyles = makeStyles({
  dialog: {
    width: '40vw',
  },
});

const TypeListScreen = ({ history }) => {
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

  const [deleteId, setDeleteId] = useState('');

  const typeListAll = useSelector((state) => state.typeListAll);
  const { loading, masterTypes, error } = typeListAll;

  const typeDelete = useSelector((state) => state.typeDelete);
  const { success: successDelete } = typeDelete;

  // const typeUpdate = useSelector((state) => state.typeUpdate);
  // const { success: successUpdate, error: errorUpdate } = typeUpdate;

  // const typeCreate = useSelector((state) => state.typeCreate);
  // const { success: successCreate, error: errorCreate } = typeCreate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const classes = useStyles();

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

  const deleteHandler = (id) => {
    setDeleteId(id);
    setOpen(true);
  };

  const confirmDeleteHandler = () => {
    setOpen(false);

    dispatch(deleteType(deleteId));
  };

  return (
    <>
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
                  history.push(`/admin/type/${rowData._id}/edit`),
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
              <span className='text-danger'>{'Delete Type'}</span>
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

export default TypeListScreen;
