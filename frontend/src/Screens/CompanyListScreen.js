import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { Row, Col, Button } from 'react-bootstrap';
import { logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import { listCompanies, deleteCompany } from '../actions/companyActions';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';

const CompanyListScreen = ({ history, location }) => {
    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const pageNumber = params.page ? params.page : 1;
    const typeFilter = params.type || '';

    const dispatch = useDispatch();

    const companyList = useSelector((state) => state.companyList);
    const { loading, error, companies, pages, page } = companyList || {};

    const companyDelete = useSelector((state) => state.companyDelete);
    const { success: successDelete } = companyDelete || {};

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
            title: 'Type',
            field: 'companyType',
            render: (rowData) => (
                <span
                    className={`badge ${
                        rowData.companyType === 'SENDER' ? 'bg-primary' : 'bg-success'
                    }`}
                >
                    {rowData.companyType}
                </span>
            ),
        },
        {
            title: 'GSTIN',
            field: 'gstin',
        },
        {
            title: 'City',
            field: 'city',
        },
        {
            title: 'State',
            field: 'state',
        },
        {
            title: 'Phone',
            field: 'phone',
        },
        {
            title: 'Default',
            field: 'isDefault',
            render: (rowData) =>
                rowData.isDefault ? (
                    <i className="fas fa-check text-success"></i>
                ) : (
                    <i className="fas fa-times text-muted"></i>
                ),
        },
    ];

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listCompanies(pageNumber, typeFilter));
        } else {
            dispatch(logout());
            history.push('/login');
        }
    }, [dispatch, history, userInfo, successDelete, pageNumber, typeFilter]);

    return (
        <AdminPageLayout>
            <Meta title="Companies - AllSchoolUniform" description="Company Address Book" />
            <Link to="/admin/billing" className="btn btn-outline-dark my-3">
                <i className="fas fa-arrow-left me-2"></i>Back to Billing
            </Link>
            <Row className="align-items-center">
                <Col>
                    <h1>COMPANIES</h1>
                </Col>
                <Col className="text-end">
                    <Button
                        variant="outline-secondary"
                        className="me-2"
                        active={!typeFilter}
                        onClick={() => history.push('/admin/billing/companies')}
                    >
                        All
                    </Button>
                    <Button
                        variant="outline-primary"
                        className="me-2"
                        active={typeFilter === 'SENDER'}
                        onClick={() => history.push('/admin/billing/companies?type=SENDER')}
                    >
                        Senders
                    </Button>
                    <Button
                        variant="outline-success"
                        className="me-2"
                        active={typeFilter === 'BUYER'}
                        onClick={() => history.push('/admin/billing/companies?type=BUYER')}
                    >
                        Buyers
                    </Button>
                    <Button
                        variant="dark"
                        className="my-3"
                        onClick={() => history.push('/admin/billing/company/create')}
                    >
                        <i className="fas fa-plus" /> ADD COMPANY
                    </Button>
                </Col>
            </Row>
            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <MaterialTable
                    title="Companies"
                    columns={columns}
                    data={companies || []}
                    options={{
                        rowStyle: { color: 'black' },
                        paging: false,
                        actionsColumnIndex: -1,
                    }}
                    editable={{
                        onRowDelete: (oldData) =>
                            new Promise((resolve, reject) => {
                                if (window.confirm(`Are you sure you want to delete "${oldData.name}"?`)) {
                                    dispatch(deleteCompany(oldData._id));
                                    resolve();
                                } else {
                                    reject();
                                }
                            }),
                    }}
                    actions={[
                        {
                            icon: 'edit',
                            tooltip: 'Edit',
                            onClick: (event, rowData) =>
                                history.push(`/admin/billing/company/${rowData._id}/edit`),
                        },
                    ]}
                />
            )}
        </AdminPageLayout>
    );
};

export default CompanyListScreen;
