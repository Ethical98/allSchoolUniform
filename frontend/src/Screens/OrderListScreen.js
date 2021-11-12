import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { logout } from '../actions/userActions';
import { listOrders } from '../actions/orderActions';
import MaterialTable from 'material-table';
import Paginate from '../components/Paginate';


const OrderListScreen = ({ history, location }) => {
  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const pageNumber = params.page ? params.page : 1;
  const dispatch = useDispatch();

  const orderList = useSelector((state) => state.orderList);
  const { loading, orders, error, pages, page } = orderList;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const columns = [
    {
      title: '#',
      field: 'tableData.id',

      render: (rowData) => rowData.tableData.id + 1,
      searchable: true,
    },
    {
      title: 'Order Id',
      field: 'orderId',
    },
    {
      title: 'User',
      field: 'user',
      render: (item) => item.user.name,
    },
    {
      title: 'Mobile',
      field: 'phone',
    },
    {
      title: 'Date',
      field: 'createdAt',
      render: (item) => item.createdAt.substring(0, 10),
    },
    {
      title: 'Total',
      field: 'totalPrice',
      render: (item) => `₹ ${item.totalPrice}`,
    },
    {
      title: 'Paid',
      field: 'isPaid',

      render: (item) =>
        item.isPaid ? (
          item.paidAt.substring(0, 10)
        ) : (
          <i className='fas fa-times' style={{ color: 'red' }}></i>
        ),
    },
    {
      title: 'Payment Method',
      field: 'paymentMethod',
    },
    {
      title: 'Delivered',

      render: (item) =>
        item.tracking.isDelivered ? (
          item.tracking.deliveredAt.substring(0, 10)
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
      dispatch(listOrders(pageNumber));
    } else {
      dispatch(logout());
      history.push('/login');
    }
  }, [dispatch, history, userInfo, pageNumber]);

  return (
    <>
      <h1>ORDERS</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <MaterialTable
            title='Orders'
            columns={columns}
            data={orders && orders}
            options={{
              search: true,
              rowStyle: {
                color: 'black',
              },
              paging: false,

              actionsColumnIndex: -1,
            }}
            actions={[
              {
                icon: 'edit',
                tooltip: 'Edit',
                onClick: (event, rowData) =>
                  history.push(`/admin/order/${rowData._id}/edit`),
              },
              {
                icon: () => (
                  <Button size='sm' variant='outline-dark'>
                    Details
                  </Button>
                ),
                tooltip: 'Details',
                onClick: (event, rowData) =>
                  history.push(`/orderdetails/${rowData._id}/`),
              },
            ]}
          />
          <Paginate pages={pages} page={page} isAdmin={true} orders={true} />
        </>
      )}
    </>
  );
};

export default OrderListScreen;
