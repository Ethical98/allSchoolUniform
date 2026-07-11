import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { Row, Col, Button, Form, Badge } from 'react-bootstrap';
import { logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import { listQuotations, deleteQuotation, updateQuotationStatus } from '../actions/billingActions';
import { QUOTATION_STATUS_RESET } from '../constants/billingConstants';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';

const statusColors = {
    DRAFT: 'secondary',
    SENT: 'primary',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'dark',
    EXPIRED: 'warning',
    CONVERTED: 'info',
};

const docTypeLabels = {
    QUOTATION: 'Quotation',
    PROFORMA_INVOICE: 'Proforma Invoice',
    TAX_INVOICE: 'Tax Invoice',
    CASH_BILL: 'Cash Bill',
};

const QuotationListScreen = ({ history, location }) => {
    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const pageNumber = params.page || 1;

    const dispatch = useDispatch();

    const [docTypeFilter, setDocTypeFilter] = useState(params.documentType || '');
    const [statusFilter, setStatusFilter] = useState(params.status || '');
    const [searchQuery, setSearchQuery] = useState(params.search || '');

    const quotationList = useSelector((state) => state.quotationList);
    const { loading, error, quotations, pages, page } = quotationList || {};

    const quotationDelete = useSelector((state) => state.quotationDelete);
    const { success: successDelete } = quotationDelete || {};

    const quotationStatus = useSelector((state) => state.quotationStatus);
    const { success: successStatus } = quotationStatus || {};

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const columns = [
        {
            title: 'Doc #',
            field: 'documentNumber',
            render: (rowData) => <strong>{rowData.documentNumber}</strong>,
        },
        {
            title: 'Type',
            field: 'documentType',
            render: (rowData) => docTypeLabels[rowData.documentType] || rowData.documentType,
        },
        {
            title: 'Buyer',
            field: 'buyer.name',
            render: (rowData) =>
                rowData.documentType === 'CASH_BILL'
                    ? rowData.walkInCustomer?.name || 'Walk-in'
                    : rowData.buyer?.name || '-',
        },
        {
            title: 'Items',
            render: (rowData) => rowData.items?.length || 0,
        },
        {
            title: 'Total',
            field: 'grandTotal',
            render: (rowData) =>
                `₹ ${(rowData.grandTotal || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                })}`,
        },
        {
            title: 'Status',
            field: 'status',
            render: (rowData) => (
                <Badge bg={statusColors[rowData.status] || 'secondary'}>
                    {rowData.status}
                </Badge>
            ),
        },
        {
            title: 'Date',
            field: 'createdAt',
            render: (rowData) => new Date(rowData.createdAt).toLocaleDateString('en-IN'),
        },
    ];

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    useEffect(() => {
        if (successStatus) {
            dispatch({ type: QUOTATION_STATUS_RESET });
        }
    }, [dispatch, successStatus]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listQuotations(pageNumber, docTypeFilter, statusFilter, searchQuery));
        } else {
            dispatch(logout());
            history.push('/login');
        }
    }, [dispatch, history, userInfo, successDelete, successStatus, pageNumber, docTypeFilter, statusFilter, searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        dispatch(listQuotations(1, docTypeFilter, statusFilter, searchQuery));
    };

    return (
        <AdminPageLayout>
            <Meta title="Billing - AllSchoolUniform" description="Quotations & Invoices" />
            <Row className="align-items-center">
                <Col>
                    <h1>BILLING</h1>
                </Col>
                <Col className="text-end">
                    <Button
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => history.push('/admin/billing/settings')}
                    >
                        <i className="fas fa-cog" />
                    </Button>
                    <Button
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => history.push('/admin/billing/cash-bill')}
                    >
                        <i className="fas fa-cash-register" /> Cash Bill
                    </Button>
                    <Button
                        variant="dark"
                        onClick={() => history.push('/admin/billing/quotation/create')}
                    >
                        <i className="fas fa-plus" /> New Document
                    </Button>
                </Col>
            </Row>

            <Row className="mb-3 mt-2">
                <Col md={3}>
                    <Form.Select
                        size="sm"
                        value={docTypeFilter}
                        onChange={(e) => setDocTypeFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="QUOTATION">Quotation</option>
                        <option value="PROFORMA_INVOICE">Proforma Invoice</option>
                        <option value="TAX_INVOICE">Tax Invoice</option>
                        <option value="CASH_BILL">Cash Bill</option>
                    </Form.Select>
                </Col>
                <Col md={3}>
                    <Form.Select
                        size="sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="CONVERTED">Converted</option>
                    </Form.Select>
                </Col>
                <Col md={4}>
                    <Form onSubmit={handleSearch} className="d-flex">
                        <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Search by document # or buyer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button variant="outline-dark" size="sm" type="submit" className="ms-2">
                            <i className="fas fa-search" />
                        </Button>
                    </Form>
                </Col>
                <Col md={2} className="text-end">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => history.push('/admin/billing/companies')}
                    >
                        <i className="fas fa-building" /> Companies
                    </Button>
                </Col>
            </Row>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <MaterialTable
                    title="Documents"
                    columns={columns}
                    data={quotations || []}
                    options={{
                        rowStyle: { color: 'black' },
                        paging: true,
                        pageSize: 20,
                        pageSizeOptions: [10, 20, 50],
                        actionsColumnIndex: -1,
                    }}
                    actions={[
                        {
                            icon: 'visibility',
                            tooltip: 'View',
                            onClick: (event, rowData) =>
                                history.push(`/admin/billing/quotation/${rowData._id}/view`),
                        },
                        (rowData) => ({
                            icon: 'edit',
                            tooltip: 'Edit',
                            onClick: (event, rd) =>
                                history.push(`/admin/billing/quotation/${rd._id}/edit`),
                            disabled: rowData.status !== 'DRAFT',
                        }),
                        (rowData) => ({
                            icon: 'send',
                            tooltip: 'Mark as Sent',
                            onClick: (event, rd) =>
                                dispatch(updateQuotationStatus(rd._id, 'SENT')),
                            disabled: rowData.status !== 'DRAFT',
                        }),
                        (rowData) => ({
                            icon: 'delete',
                            tooltip: 'Delete',
                            onClick: (event, rd) => {
                                if (window.confirm('Are you sure you want to delete this document?')) {
                                    dispatch(deleteQuotation(rd._id));
                                }
                            },
                            disabled: rowData.status !== 'CANCELLED' && rowData.status !== 'DRAFT',
                        }),
                    ]}
                />
            )}
        </AdminPageLayout>
    );
};

export default QuotationListScreen;
