import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { Image, Row, Col, Button } from 'react-bootstrap';
import { logout } from '../actions/userActions';
import MaterialTable from 'material-table';
import { deleteSchool, listSchools } from '../actions/schoolActions';
import Paginate from '../components/Paginate';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';

const SchoolListScreen = ({ history, location }) => {
    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const pageNumber = params.page ? params.page : 1;

    const dispatch = useDispatch();

    const schoolList = useSelector(state => state.schoolList);
    const { loading, masterSchools, error, pages, page } = schoolList;

    const schoolDelete = useSelector(state => state.schoolDelete);
    const { success: successDelete } = schoolDelete;

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

    const columns = [
        {
            title: '#',
            field: 'tableData.id',

            render: rowData => rowData.tableData.id + 1
        },
        {
            title: 'Logo',
            field: 'logo',
            render: item => <Image src={item.logo} alt={item.name} style={{ width: '5vw' }} fluid rounded />
        },
        {
            title: 'Name',
            field: 'name'
        },
        {
            title: 'Address',
            field: 'address'
        },
        {
            title: 'Contact',
            field: 'contact'
        }
    ];

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);
    // Auth verification handled by backend via HTTP-only cookies

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listSchools(pageNumber));
        } else {
            dispatch(logout());
            history.push('/login');
        }
    }, [dispatch, history, userInfo, successDelete, pageNumber]);

    return (
        <AdminPageLayout>
            <Meta title={'List School - AllSchoolUniform'} description={'School List Page'} />
            <Row className="align-items-center">
                <Col>
                    <h1>SCHOOLS</h1>
                </Col>
                <Col>
                    <Button
                        variant="dark"
                        className="my-3 float-end "
                        onClick={() => history.push('/admin/school/create')}
                    >
                        <i className="fas fa-plus" /> ADD SCHOOL
                    </Button>
                    <Button
                        variant="outline-primary"
                        className="m-3  float-end"
                        onClick={() => history.push('/admin/classlist')}
                    >
                        CLASSES
                    </Button>
                </Col>
            </Row>
            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    <MaterialTable
                        title="Schools"
                        columns={columns}
                        data={masterSchools && masterSchools}
                        options={{
                            rowStyle: {
                                color: 'black'
                            },
                            paging: false,
                            actionsColumnIndex: -1
                        }}
                        editable={{
                            onRowDelete: oldData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        dispatch(deleteSchool(oldData._id));
                                        resolve();
                                    }, 1000);
                                })
                        }}
                        actions={[
                            {
                                icon: 'edit',
                                tooltip: 'Edit',
                                onClick: (event, rowData) => history.push(`/admin/school/${rowData._id}/edit`)
                            }
                        ]}
                    />
                    <Paginate pages={pages} page={page} isAdmin schools />
                </>
            )}
        </AdminPageLayout>
    );
};

export default SchoolListScreen;
