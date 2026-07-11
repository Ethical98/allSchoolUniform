import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Row, Col, Button, Form } from 'react-bootstrap';
import MaterialTable from 'material-table';
import Message from '../components/Message';
import Loader from '../components/Loader';
import AdminPageLayout from '../components/AdminPageLayout';
import Meta from '../components/Meta';
import { logout } from '../actions/userActions';
import {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
} from '../actions/billingActions';

const TEMPLATE_TYPES = ['COVER', 'TERMS', 'HEADER', 'FOOTER'];

const TemplateListScreen = ({ history }) => {
    const dispatch = useDispatch();

    const [tableData, setTableData] = useState([]);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const templateList = useSelector((state) => state.templateList);
    const { loading, error, templates } = templateList;

    const templateCreateState = useSelector((state) => state.templateCreate);
    const { success: successCreate } = templateCreateState;

    const templateUpdateState = useSelector((state) => state.templateUpdate);
    const { success: successUpdate } = templateUpdateState;

    const templateDeleteState = useSelector((state) => state.templateDelete);
    const { success: successDelete } = templateDeleteState;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        } else if (!userInfo.isAdmin) {
            dispatch(logout());
            history.push('/login');
        }
    }, [history, userInfo, dispatch]);

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listTemplates());
        }
    }, [dispatch, userInfo, successCreate, successUpdate, successDelete]);

    useEffect(() => {
        if (templates) {
            setTableData([...templates]);
        }
    }, [templates]);

    const columns = [
        {
            title: '#',
            field: 'tableData.id',
            editable: 'never',
            width: 50,
            render: (rowData) => rowData.tableData.id + 1,
        },
        {
            title: 'Name',
            field: 'name',
            validate: (rowData) => (rowData.name ? true : 'Name is required'),
        },
        {
            title: 'Type',
            field: 'type',
            lookup: TEMPLATE_TYPES.reduce((acc, t) => ({ ...acc, [t]: t }), {}),
            validate: (rowData) => (rowData.type ? true : 'Type is required'),
        },
        {
            title: 'Content',
            field: 'content',
            render: (rowData) =>
                rowData.content
                    ? rowData.content.substring(0, 80) + (rowData.content.length > 80 ? '...' : '')
                    : '-',
            editComponent: (props) => (
                <Form.Control
                    as="textarea"
                    rows={4}
                    value={props.value || ''}
                    onChange={(e) => props.onChange(e.target.value)}
                    placeholder="Template content..."
                />
            ),
        },
        {
            title: 'Default',
            field: 'isDefault',
            type: 'boolean',
            render: (rowData) =>
                rowData.isDefault ? (
                    <i className="fas fa-check text-success"></i>
                ) : (
                    <i className="fas fa-times text-muted"></i>
                ),
            editComponent: (props) => (
                <Form.Check
                    type="checkbox"
                    label="Default"
                    checked={!!props.value}
                    onChange={(e) => props.onChange(e.target.checked)}
                />
            ),
        },
    ];

    return (
        <AdminPageLayout>
            <Meta title="Document Templates - AllSchoolUniform" />

            <Row className="align-items-center mb-3">
                <Col>
                    <h4 className="mb-0">Document Templates</h4>
                </Col>
                <Col className="text-end">
                    <Link to="/admin/billing" className="btn btn-outline-dark">
                        <i className="fas fa-arrow-left me-1"></i> Back to Billing
                    </Link>
                </Col>
            </Row>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <MaterialTable
                    title=""
                    columns={columns}
                    data={tableData}
                    options={{
                        actionsColumnIndex: -1,
                        addRowPosition: 'first',
                        pageSize: 10,
                        pageSizeOptions: [10, 20, 50],
                        headerStyle: { fontWeight: 'bold' },
                    }}
                    editable={{
                        onRowAdd: (newData) =>
                            new Promise((resolve) => {
                                dispatch(
                                    createTemplate({
                                        name: newData.name,
                                        type: newData.type,
                                        content: newData.content || '',
                                        isDefault: newData.isDefault || false,
                                    })
                                );
                                resolve();
                            }),
                        onRowUpdate: (newData) =>
                            new Promise((resolve) => {
                                dispatch(
                                    updateTemplate(newData._id, {
                                        name: newData.name,
                                        type: newData.type,
                                        content: newData.content || '',
                                        isDefault: newData.isDefault || false,
                                    })
                                );
                                resolve();
                            }),
                        onRowDelete: (oldData) =>
                            new Promise((resolve, reject) => {
                                if (window.confirm(`Are you sure you want to delete template "${oldData.name}"?`)) {
                                    dispatch(deleteTemplate(oldData._id));
                                    resolve();
                                } else {
                                    reject();
                                }
                            }),
                    }}
                />
            )}
        </AdminPageLayout>
    );
};

export default TemplateListScreen;
