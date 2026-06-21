import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import MaterialTable from 'material-table';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AdminPageLayout from '../components/AdminPageLayout';
import Paginate from '../components/Paginate';
import ReturnStatusBadge from '../components/ReturnStatusBadge';
import ReturnTriageCards from '../components/returns/ReturnTriageCards';
import buildReturnActions from '../components/returns/nextActionMap';
import { listReturns, getReturnsDashboard } from '../actions/returnActions';
import { logout } from '../actions/userActions';

const STATUSES = [
    '', 'INITIATED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKUP_FAILED',
    'IN_TRANSIT', 'RECEIVED', 'QC_IN_PROGRESS', 'QC_COMPLETED',
    'REFUND_INITIATED', 'EXCHANGE_SHIPPED', 'REPLACEMENT_SHIPPED',
    'COMPLETED', 'REJECTED', 'CANCELLED',
];

const TYPES = ['', 'RETURN', 'EXCHANGE', 'REPLACEMENT'];

const ageLabel = (createdAt) => {
    if (!createdAt) return { text: '-', stale: false };
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
    if (days <= 0) return { text: 'today', stale: false };
    return { text: `${days}d`, stale: days >= 3 };
};

const ReturnListScreen = ({ history, location }) => {
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [type, setType] = useState('');
    const [activeBucket, setActiveBucket] = useState('');

    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const pageNumber = params.page ? params.page : 1;

    const dispatch = useDispatch();

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const returnList = useSelector((state) => state.returnList);
    const { loading, error, returns, pages, page } = returnList;

    const returnDashboard = useSelector((state) => state.returnDashboard);
    const {
        loading: dashLoading,
        error: dashError,
        stats: dashboard,
    } = returnDashboard;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(getReturnsDashboard());
        } else {
            dispatch(logout());
            history.push('/login');
        }
        // eslint-disable-next-line
    }, [dispatch, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listReturns(pageNumber, keyword, status, type));
        }
    }, [dispatch, userInfo, pageNumber, keyword, status, type]);

    const searchHandler = (e) => {
        e.preventDefault();
        dispatch(listReturns(1, keyword, status, type));
    };

    const handleBucketSelect = (bucket) => {
        if (!bucket) {
            setActiveBucket('');
            setStatus('');
            setType('');
            dispatch(listReturns(1, keyword, '', ''));
            return;
        }
        setActiveBucket(bucket.key);
        setStatus(bucket.filter.status);
        setType(bucket.filter.type);
        dispatch(listReturns(1, keyword, bucket.filter.status, bucket.filter.type));
    };

    const columns = [
        {
            title: '#',
            field: 'tableData.id',
            render: (rowData) => rowData.tableData.id + 1,
        },
        {
            title: 'Return ID',
            field: 'returnId',
        },
        {
            title: 'Order ID',
            field: 'orderId',
        },
        {
            title: 'Customer',
            field: 'customerName',
            render: (item) => item.customerName || '-',
        },
        {
            title: 'Type',
            field: 'type',
        },
        {
            title: 'Status',
            field: 'status',
            render: (item) => <ReturnStatusBadge status={item.status} />,
        },
        {
            title: 'Reason',
            field: 'reason',
            render: (item) => item.reason ? item.reason.substring(0, 30) : '-',
        },
        {
            title: 'Amount',
            field: 'refundAmount',
            render: (item) =>
                item.refundAmount != null ? `₹ ${item.refundAmount}` : '-',
        },
        {
            title: 'Created',
            field: 'createdAt',
            render: (row) => row.createdAt?.substring(0, 10),
        },
        {
            title: 'Age',
            field: 'createdAt',
            render: (row) => {
                const a = ageLabel(row.createdAt);
                return <span className={a.stale ? 'ret-age-stale' : ''}>{a.text}</span>;
            },
        },
        {
            title: 'Next',
            sorting: false,
            render: (row) => {
                const actions = buildReturnActions(row, row.nextStatuses || []);
                const primary = actions.find((x) => x.kind === 'primary');
                return primary ? <span className="ret-next-link">{primary.label.split(' · ')[0]} →</span> : '-';
            },
        },
    ];

    const Table = useMemo(
        () => (
            <MaterialTable
                title="Returns / Exchanges"
                columns={columns}
                data={returns || []}
                options={{
                    rowStyle: { color: 'black' },
                    paging: false,
                    search: false,
                    actionsColumnIndex: -1,
                }}
                onRowClick={(e, rowData) => {
                    window.open(`/admin/returns/${rowData._id}`, '_blank');
                }}
            />
        ),
        // eslint-disable-next-line
        [returns]
    );

    return (
        <AdminPageLayout>
            <h2>Returns & Exchanges</h2>

            {/* Dashboard Stats */}
            {dashError && <Message variant="danger">{dashError}</Message>}
            <ReturnTriageCards
                stats={dashboard}
                dashLoading={dashLoading}
                activeKey={activeBucket}
                onSelect={handleBucketSelect}
            />

            {/* Filters */}
            <Row className="mb-3">
                <Col md={3}>
                    <Form onSubmit={searchHandler}>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Search by ID, name..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <Button type="submit" variant="outline-secondary">
                                <i className="fas fa-search" />
                            </Button>
                        </InputGroup>
                    </Form>
                </Col>
                <Col md={3}>
                    <Form.Control
                        as="select"
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setActiveBucket(''); }}
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s ? s.replace(/_/g, ' ') : 'All Statuses'}
                            </option>
                        ))}
                    </Form.Control>
                </Col>
                <Col md={3}>
                    <Form.Control
                        as="select"
                        value={type}
                        onChange={(e) => { setType(e.target.value); setActiveBucket(''); }}
                    >
                        {TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t || 'All Types'}
                            </option>
                        ))}
                    </Form.Control>
                </Col>
            </Row>

            {/* Table */}
            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    {Table}
                    <Paginate pages={pages} page={page} isAdmin={true} url="/admin/returns" />
                </>
            )}
        </AdminPageLayout>
    );
};

export default ReturnListScreen;
