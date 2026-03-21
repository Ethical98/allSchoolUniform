import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import MaterialTable from 'material-table';
import Loader from '../components/Loader';
import Message from '../components/Message';
import AdminPageLayout from '../components/AdminPageLayout';
import Paginate from '../components/Paginate';
import Meta from '../components/Meta';
import { getStockOverview } from '../actions/stockActions';
import { logout } from '../actions/userActions';

const NUMBER_SIZES = ['20','22','24','26','28','30','32','34','36','38','40','42','44'];
const LETTER_SIZES = ['XS','S','M','L','XL','XXL','XXXL'];

const StockOverviewScreen = ({ history, location }) => {
    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const pageNumber = params.page ? params.page : 1;

    const [search, setSearch] = useState('');
    const [school, setSchool] = useState('');
    const [type, setType] = useState('');
    const [stockStatus, setStockStatus] = useState(params.stockStatus || '');
    const [sizeFilter, setSizeFilter] = useState('');
    const [season, setSeason] = useState(params.season || '');

    const dispatch = useDispatch();

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const stockOverview = useSelector((state) => state.stockOverview);
    const { loading, error, products, pages, page } = stockOverview;

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
            dispatch(getStockOverview(pageNumber, school, type, search, stockStatus, sizeFilter, season));
        }
    }, [dispatch, userInfo, pageNumber, school, type, search, stockStatus, sizeFilter, season]);

    const handleSearch = () => {
        history.push('/admin/stock/overview');
        dispatch(getStockOverview(1, school, type, search, stockStatus, sizeFilter, season));
    };

    const getStockBadge = (product) => {
        const totalStock = product.size
            ? product.size.reduce((sum, s) => sum + (s.countInStock || 0), 0)
            : 0;

        if (totalStock <= 0) return <Badge bg="danger">Out of Stock</Badge>;

        const hasLowStock = product.size && product.size.some(
            (s) => s.alertOnQty && s.countInStock <= s.alertOnQty && s.countInStock > 0
        );
        if (hasLowStock) return <Badge bg="warning" text="dark">Low Stock</Badge>;

        return <Badge bg="success">In Stock</Badge>;
    };

    const columns = [
        {
            title: '#',
            field: 'tableData.id',
            render: (rowData) => rowData.tableData.id + 1
        },
        {
            title: 'Product Name',
            field: 'name'
        },
        {
            title: 'SKU',
            field: 'SKU'
        },
        {
            title: 'Type',
            field: 'type'
        },
        {
            title: 'Sizes / Stock',
            render: (item) =>
                item.size && item.size.length > 0
                    ? item.size.map((s, i) => (
                          <span key={i} className="me-2">
                              {s.size}:
                              <strong
                                  style={{
                                      color: s.countInStock <= 0 ? 'red' : s.alertOnQty && s.countInStock <= s.alertOnQty ? 'orange' : 'green'
                                  }}
                              >
                                  {s.countInStock}
                              </strong>
                              {i < item.size.length - 1 ? ', ' : ''}
                          </span>
                      ))
                    : '-'
        },
        {
            title: 'Total Stock',
            render: (item) => {
                const total = item.size ? item.size.reduce((sum, s) => sum + (s.countInStock || 0), 0) : 0;
                return <strong>{total}</strong>;
            }
        },
        {
            title: 'Status',
            render: (item) => getStockBadge(item)
        }
    ];

    const Table = useMemo(
        () => (
            <MaterialTable
                title="Stock Overview"
                columns={columns}
                data={products || []}
                options={{
                    rowStyle: { color: 'black' },
                    paging: false,
                    search: false,
                    actionsColumnIndex: -1
                }}
                actions={[
                    {
                        icon: 'visibility',
                        tooltip: 'View Details',
                        onClick: (event, rowData) => history.push(`/admin/stock/product/${rowData._id}`)
                    },
                    {
                        icon: 'edit',
                        tooltip: 'Adjust Stock',
                        onClick: (event, rowData) => history.push(`/admin/stock/adjust/${rowData._id}`)
                    }
                ]}
            />
        ),
        // eslint-disable-next-line
        [products]
    );

    return (
        <AdminPageLayout>
            <Meta title="Stock Overview - Allschooluniform" />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>STOCK OVERVIEW</h1>
                <div>
                    <LinkContainer to="/admin/stock">
                        <Button variant="outline-secondary" className="me-2">
                            <i className="fas fa-chart-bar"></i> Dashboard
                        </Button>
                    </LinkContainer>
                    <LinkContainer to="/admin/stock/adjust">
                        <Button variant="primary">
                            <i className="fas fa-plus"></i> Adjust Stock
                        </Button>
                    </LinkContainer>
                </div>
            </div>

            <div className="d-flex gap-2 mb-3">
                <InputGroup className="w-50">
                    <Form.Control
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product name or SKU"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}>Search</Button>
                </InputGroup>

                <Form.Select
                    value={sizeFilter}
                    onChange={(e) => { setSizeFilter(e.target.value); history.push('/admin/stock/overview'); }}
                    style={{ width: '200px' }}
                >
                    <option value="">All Sizes</option>
                    <optgroup label="Number Sizes">
                        {NUMBER_SIZES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Letter Sizes">
                        {LETTER_SIZES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Other">
                        <option value="Free Size">Free Size</option>
                    </optgroup>
                </Form.Select>

                <Form.Select
                    value={stockStatus}
                    onChange={(e) => { setStockStatus(e.target.value); history.push('/admin/stock/overview'); }}
                    style={{ width: '200px' }}
                >
                    <option value="">All Stock Status</option>
                    <option value="in">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                </Form.Select>

                <Form.Select
                    value={season}
                    onChange={(e) => { setSeason(e.target.value); history.push('/admin/stock/overview'); }}
                    style={{ width: '180px' }}
                >
                    <option value="">All Seasons</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                </Form.Select>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message variant="danger">{error}</Message>
            ) : (
                <>
                    {Table}
                    <Paginate pages={pages} page={page} keyword="" url="/admin/stock/overview" />
                </>
            )}
        </AdminPageLayout>
    );
};

export default StockOverviewScreen;
