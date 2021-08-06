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
import MaterialButton from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/styles';
import { listSchools } from '../actions/schoolActions';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { TablePagination } from '@material-ui/core';
import Paginate from '../components/Paginate';

const useStyles = makeStyles({
  dialog: {
    width: '40vw',
  },
});

const ProductListScreen = ({ history, match }) => {
  const pageNumber = match.params.pageNumber || 1;
  const classes = useStyles();
  const dispatch = useDispatch();

  const productList = useSelector((state) => state.productList);
  const { loading, products, error, pages, page } = productList;

  const schoolList = useSelector((state) => state.schoolList);
  const { masterSchools } = schoolList;

  const productDelete = useSelector((state) => state.productDelete);
  const {
    loading: loadingDelete,
    success: successDelete,
    error: errorDelete,
  } = productDelete;

  const [school, setSchool] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [open, setOpen] = useState(false);
  const [masterSchool, setMasterSchool] = useState([]);

  const [deleteId, setDeleteId] = useState('');

  useEffect(() => {
    if (products) {
      setFilteredData(products);
    }
  }, [products]);

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
    if (school) {
      setFilteredData(
        products.filter((x) => x.schoolName.includes(school.toUpperCase()))
      );
    }
  }, [school, products]);

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET });
    if (userInfo && !userInfo.isAdmin) {
      dispatch(logout());
      history.push('/login');
    } else {
      dispatch(listProducts('', pageNumber));
      dispatch(listSchools());
    }
  }, [dispatch, history, userInfo, successDelete, pageNumber]);

  useEffect(() => {
    if (masterSchools) {
      setMasterSchool([...masterSchools]);
    }
  }, [masterSchools]);

  const deleteHandler = (id) => {
    setDeleteId(id);
    setOpen(true);
  };
  const confirmDeleteHandler = () => {
    setOpen(false);

    dispatch(deleteProduct(deleteId));
  };
  const createProductHandler = () => {
    history.push('/admin/product/create');
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title' className={classes.dialog}>
          <span className='text-primary'>{'Delete Product'}</span>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            <span className='text-danger'>Are You Sure?</span>
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
      <Row className='align-items-center'>
        <Col>
          <h1>PRODUCTS</h1>
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
      {loadingDelete && <Loader />}
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
            data={filteredData}
            columns={columns}
            options={{
              rowStyle: {
                color: 'black',
                border: '1px solid grey',
              },
              actionsColumnIndex: -1,
              paging: false,
            }}
            actions={[
              {
                icon: 'edit',
                tooltip: 'Edit',
                onClick: (event, rowData) =>
                  history.push(`/admin/product/${rowData._id}/edit`),
              },
              {
                icon: 'delete',
                tooltip: 'Delete',
                onClick: (event, rowData) => deleteHandler(rowData._id),
              },
              {
                icon: () => (
                  <Autocomplete
                    options={masterSchool}
                    getOptionLabel={(option) => option.name}
                    onChange={(option, value) => value && setSchool(value.name)}
                    style={{ width: 250 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Filter By School'
                        variant='outlined'
                      />
                    )}
                  />
                ),
                tooltip: 'Filter',
                isFreeAction: true,
              },
            ]}
          />
          <Paginate pages={pages} page={page} isAdmin='true' />
        </>
      )}
    </>
  );
};

export default ProductListScreen;
