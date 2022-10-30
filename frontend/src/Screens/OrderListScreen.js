import React, { useEffect, useMemo, useState } from 'react';
import { CSVLink } from 'react-csv';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import jsonwebtoken from 'jsonwebtoken';
import { logout } from '../actions/userActions';
import { listOrders } from '../actions/orderActions';
import MaterialTable from 'material-table';
import Paginate from '../components/Paginate';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import { join, map } from 'lodash';
import { Button, Form, InputGroup } from 'react-bootstrap';

const OrderListScreen = ({ history, location }) => {
    const [keyword, setKeyword] = useState('');
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
            searchable: true
        },
        {
            title: 'Order Id',
            field: 'orderId'
        },
        {
            title: 'User',
            field: 'user',
            render: (item) => item.user.name
        },
        {
            title: 'Mobile',
            field: 'phone'
        },
        {
            title: 'Date',
            field: 'createdAt',
            render: (item) => item.createdAt.substring(0, 10)
        },
        {
            title: 'Total',
            field: 'totalPrice',
            render: (item) => `₹ ${item.totalPrice}`
        },
        {
            title: 'Paid',
            field: 'isPaid',

            render: (item) =>
                item.isPaid ? item.paidAt.substring(0, 10) : <i className="fas fa-times" style={{ color: 'red' }}></i>
        },
        {
            title: 'Location',
            render: (item) => item.shippingAddress.city
        },
        {
            title: 'Payment Method',
            field: 'paymentMethod'
        },
        {
            title: 'Status',

            render: (item) =>
                item.tracking.isCanceled ? (
                    <p style={{ color: 'red' }}>
                        <strong>Canceled: {item.tracking.canceledAt.substring(0, 10)}</strong>
                    </p>
                ) : item.tracking.isDelivered ? (
                    <p style={{ color: 'darkGreen' }}>
                        <strong>Delivered: {item.tracking.deliveredAt.substring(0, 10)}</strong>
                    </p>
                ) : item.tracking.isOutForDelivery ? (
                    <p style={{ color: 'yellow' }}>
                        <strong>`Out For Delivery: {item.tracking.outForDeliveryAt.substring(0, 10)}`</strong>
                    </p>
                ) : item.tracking.isProcessing ? (
                    <p style={{ color: 'purple' }}>
                        <strong>Processed: {item.tracking.processedAt.substring(0, 10)}</strong>
                    </p>
                ) : item.tracking.isConfirmed ? (
                    <p style={{ color: 'blue' }}>
                        <strong>Confirmed: {item.tracking.confirmedAt.substring(0, 10)}</strong>
                    </p>
                ) : (
                    'Recieved'
                )
        }
    ];

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

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

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listOrders(pageNumber));
        } else {
            dispatch(logout());
            history.push('/login');
        }
    }, [dispatch, userInfo, pageNumber]);

    const csvData = map(orders, (order) => ({
        orderId: order.orderId,
        status: order.tracking.isCanceled
            ? `Canceled: ${order.tracking.canceledAt.substring(0, 10)}`
            : order.tracking.isDelivered
            ? `Delivered: ${order.tracking.deliveredAt.substring(0, 10)}`
            : order.tracking.isOutForDelivery
            ? `Out For Delivery: ${order.tracking.outForDeliveryAt.substring(0, 10)}`
            : order.tracking.isProcessing
            ? `Processed: ${order.tracking.processedAt.substring(0, 10)}`
            : order.tracking.isConfirmed
            ? `Confirmed: ${order.tracking.confirmedAt.substring(0, 10)}`
            : 'Recieved',
        name: order.user.name,
        phone: order.phone,
        createdAt: order.createdAt.substring(0, 10),
        totalPrice: order.totalPrice,
        isPaid: order.isPaid ? 'YES' : 'NO',
        location: order.shippingAddress.city,
        paymentMethod: order.paymentMethod,
        orderItems: join(
            map(order.orderItems, (item, index) => index + 1 + '.' + ' ' + item.name + ' ' + 'Size: ' + item.size),
            ' '
        )
    }));

    const headers = [
        { label: 'Order Id', key: 'orderId' },
        { label: 'Status', key: 'status' },
        { label: 'Name', key: 'name' },
        { label: 'Phone', key: 'phone' },
        { label: 'Data', key: 'createdAt' },
        { label: 'Total', key: 'totalPrice' },
        { label: 'Paid', key: 'isPaid' },
        { label: 'Location', key: 'location' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Order Items', key: 'orderItems' }
    ];
    const currentDate = new Date();

    const Table = useMemo(
        () => (
            <MaterialTable
                title="Orders"
                columns={columns}
                data={orders}
                options={{
                    rowStyle: {
                        color: 'black'
                    },
                    paging: false,
                    search: false,
                    actionsColumnIndex: -1
                }}
                actions={[
                    {
                        icon: 'edit',
                        tooltip: 'Edit',
                        onClick: (event, rowData) => window.open(`/admin/order/${rowData._id}/edit`, '_blank')
                    },
                    {
                        icon: () => <i class="fa-solid fa-circle-info"></i>,
                        tooltip: 'Details',
                        onClick: (event, rowData) => history.push(`/orderdetails/${rowData._id}`)
                    }
                ]}
            />
        ),
        [orders]
    );

    return (
        <AdminPageLayout>
            <Meta
                title={`Orders List - Allschooluniform`}
                description={'Orders'}
                keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details,orders'}
            />
            <h1>ORDERS</h1>
            <div className="d-flex justify-content-between mb-3">
                <CSVLink
                    data={csvData}
                    headers={headers}
                    filename={`${currentDate.getDate()}-${currentDate.getMonth()}-${currentDate.getFullYear()}-${currentDate.getTime()}-Orders`}
                    className="btn btn-primary"
                >
                    Export to CSV
                </CSVLink>
                <InputGroup className="w-50">
                    <Form.Control
                        required
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Search Orders"
                    />
                    <Button onClick={() => dispatch(listOrders(1, keyword))}>Search</Button>
                </InputGroup>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    {Table}
                    <Paginate pages={pages} page={page} isAdmin orders />
                </>
            )}
        </AdminPageLayout>
    );
};

export default OrderListScreen;
