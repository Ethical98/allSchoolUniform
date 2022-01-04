import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import jsonwebtoken from 'jsonwebtoken';
import {
  Button,
  Form,
  Col,
  Row,
  Container,
  FloatingLabel,
  Image,
  ListGroup,
  Card,
  InputGroup,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import {
  getOrderDetails,
  editOrder,
  deliverOrder,
  outForDeliveryOrder,
  processOrder,
  confirmOrder,
} from '../actions/orderActions';
import {
  ORDER_CONFIRM_RESET,
  ORDER_DELIVER_RESET,
  ORDER_OUT_FOR_DELIVERY_RESET,
  ORDER_PROCESSING_RESET,
  ORDER_UPDATE_RESET,
} from '../constants/orderConstants';
import { logout } from '../actions/userActions';
import Loader from '../components/Loader';
import MaterialTable from 'material-table';
import { LinkContainer } from 'react-router-bootstrap';
import { listProductDetailsById } from '../actions/productActions';
import { listSchoolNames, listSchools } from '../actions/schoolActions';
import { listProducts } from '../actions/productActions';
import Paginate from '../components/Paginate';
import DialogBox from '../components/DialogBox';
import Invoice from '../components/Invoice/Invoice';
import { usePDF } from '@react-pdf/renderer';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

const OrderEditScreen = ({ history, match, location }) => {
  const dispatch = useDispatch();
  const orderId = match.params.id;
  const urlSearchParams = new URLSearchParams(location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  const pageNumber = params.page ? params.page : 1;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const orderDetails = useSelector((state) => state.orderDetails);
  const { order, loading, error } = orderDetails;

  const productDetails = useSelector((state) => state.productDetails);
  const { product } = productDetails;

  const orderUpdate = useSelector((state) => state.orderUpdate);
  const { loading: loadingUpdate, error: errorUpdate, success } = orderUpdate;

  const orderDeliver = useSelector((state) => state.orderDeliver);
  const {
    loading: loadingDeliver,
    error: errorDeliver,
    success: successDeliver,
  } = orderDeliver;

  const orderProcessing = useSelector((state) => state.orderProcessing);
  const {
    loading: loadingProcessing,
    error: errorProcessing,
    success: successProcessing,
  } = orderProcessing;

  const orderOutForDelivery = useSelector((state) => state.orderOutForDelivery);
  const {
    loading: loadingOutForDelivery,
    error: errorOutForDelivery,
    success: successOutForDelivery,
  } = orderOutForDelivery;

  const orderConfirm = useSelector((state) => state.orderConfirm);
  const {
    loading: loadingConfirm,
    error: errorConfirm,
    success: successConfirm,
  } = orderConfirm;

  const productList = useSelector((state) => state.productList);
  const {
    loading: loadingProducts,
    error: errorProducts,
    products,
    pages,
    page,
  } = productList;

  const schoolNameList = useSelector((state) => state.schoolNameList);
  const { schoolNames } = schoolNameList;

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [productSizes, setProductSizes] = useState([]);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [modifiedOrderItems, setModifiedOrderItems] = useState([{}]);
  const [size, setSize] = useState('');
  const [index, setIndex] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [countInStock, setCountInStock] = useState(0);
  const [qty, setQty] = useState(1);
  const [itemsPrice, setItemsPrice] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [modify, setModify] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [school, setSchool] = useState('');
  const [countInStockIndex, setCountInStockIndex] = useState(0);
  const [productId, setProductId] = useState('');
  const [editIndex, setEditIndex] = useState(0);
  const [newProducts, setNewProducts] = useState([]);
  const [newItemsToAdd, setNewItemsToAdd] = useState([]);
  const [newQty, setNewQty] = useState(0);
  const [newSize, setNewSize] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [isOutForDelivery, setIsOutForDelivery] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [instance, updateInstance] = usePDF({
    document: (
      <Invoice
        name={name}
        email={email}
        order={order && order}
        isAdmin={true}
      />
    ),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const orderItemColumns = [
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
    {
      title: 'Name',
      field: 'name',
    },

    {
      title: 'Size',
      field: 'size',
    },
    {
      title: 'Qty',
      field: 'qty',
    },
    {
      title: 'Discount',
      field: 'disc',
    },
    {
      title: 'Price',
      field: 'price',
      render: (item) => `₹ ${item.price}`,
    },
  ];

  const newProductColumns = [
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
    {
      title: 'Size',
      field: 'size',
      width: 120,
      minWidth: 120,
      render: (item) => (
        <Form.Select
          size='sm'
          onChange={(e) =>
            newSizeHandler(
              e.target.value,
              item._id,
              item.size,
              item.name,
              item.image
            )
          }
        >
          <option>Select</option>
          {item.size
            .sort((a, b) => {
              return a.size - b.size;
            })
            .map((x) => (
              <option value={x.size} key={x.size}>
                {x.size}
              </option>
            ))}
        </Form.Select>
      ),
    },
    {
      title: 'Stock',
      field: 'tableData.id',
      width: 120,
      minWidth: 120,
      render: (item) => (
        <Form.Select
          size='sm'
          onChange={(e) => newQtyHandler(e.target.value, item._id)}
        >
          <option>Select</option>

          {[
            ...Array(
              item.size[countInStockIndex] && item._id === productId
                ? products[item.tableData.id].size[countInStockIndex]
                    .countInStock
                : newProducts.some((x) => x.product === item._id)
                ? products[item.tableData.id].size[
                    products[item.tableData.id].size.findIndex(
                      (y) =>
                        y.size ===
                        newProducts[
                          newProducts.findIndex((x) => x.product === item._id)
                        ].size
                    )
                  ].countInStock
                : products[item.tableData.id].size[0].countInStock
            ).keys(),
          ].map((x) => (
            <option key={x + 1} value={x + 1}>
              {x + 1}
            </option>
          ))}
        </Form.Select>
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
    if (success) {
      dispatch({ type: ORDER_UPDATE_RESET });

      history.push('/admin/orderlist');
    } else {
      if (
        !order ||
        order._id !== orderId ||
        successConfirm ||
        successProcessing ||
        successOutForDelivery ||
        successDeliver
      ) {
        dispatch({ type: ORDER_DELIVER_RESET });
        dispatch({ type: ORDER_CONFIRM_RESET });
        dispatch({ type: ORDER_PROCESSING_RESET });
        dispatch({ type: ORDER_OUT_FOR_DELIVERY_RESET });
        dispatch(getOrderDetails(orderId));
        dispatch(listProducts());
        dispatch(listSchools());
      } else {
        setName(order.user.name);
        setEmail(order.user.email);
        setOrderItems(order.orderItems);
        setPhone(order.user.phone);
        setAddress(order.shippingAddress.address);
        setCity(order.shippingAddress.city);
        setCountry(order.shippingAddress.country);
        setPostalCode(order.shippingAddress.postalCode);
        setPaymentMethod(order.paymentMethod);
        setTotalPrice(order.totalPrice);
        setModify(order.modified);
        setIsProcessing(order.tracking.isProcessing);
        setIsDelivered(order.tracking.isDelivered);
        setIsOutForDelivery(order.tracking.isOutForDelivery);
        setIsConfirmed(order.tracking.isConfirmed);
        setOrderNumber(order.orderId);

        updateInstance({
          document: (
            <Invoice
              name={name}
              email={email}
              order={order && order}
              total={order.totalPrice}
              isAdmin={true}
            />
          ),
        });

        if (order.modifiedItems.length > 0) {
          setModifiedOrderItems([...order.modifiedItems]);
          setItemsPrice(
            Number(
              order.modifiedItems
                .reduce(
                  (acc, item) => acc + item.price * item.qty + Number(item.tax),
                  0
                )
                .toFixed(2)
            )
          );
        } else {
          setModifiedOrderItems([...order.orderItems.map((a) => ({ ...a }))]);
          setItemsPrice(
            Number(
              order.orderItems
                .reduce(
                  (acc, item) => acc + item.price * item.qty + Number(item.tax),
                  0
                )
                .toFixed(2)
            )
          );
        }
      }
    }
    // eslint-disable-next-line
  }, [
    order,
    orderId,
    dispatch,
    history,
    success,
    successConfirm,
    successDeliver,
    successOutForDelivery,
    successProcessing,
    name,
    email,
  ]);

  useEffect(() => {
    if (userInfo && !userInfo.isAdmin) {
      dispatch(logout());
      history.push('/login');
    }
  }, [dispatch, history, userInfo]);

  useEffect(() => {
    if (product && product.size) {
      setProductSizes([...product.size]);
      setCountInStock(product.size[0].countInStock);
    }
  }, [product]);

  useEffect(() => {
    if (productSizes.length > 0 && editIndex === 0 && size) {
      setCountInStock(
        productSizes[productSizes.findIndex((x) => x.size === size.toString())]
          .countInStock
      );
    } else if (productSizes.length > 0 && size) {
      setCountInStock(productSizes[editIndex].countInStock);
    } // eslint-disable-next-line
  }, [productSizes, size, editIndex]);

  useEffect(() => {
    setItemsPrice(
      Number(
        modifiedOrderItems
          .reduce(
            (acc, item) => acc + item.price * item.qty + Number(item.tax),
            0
          )
          .toFixed(2)
      )
    );
  }, [modifiedOrderItems]);

  useEffect(() => {
    if (order) {
      setTotalPrice(Number(itemsPrice + order.shippingPrice, order.taxPrice));
    }
  }, [order, itemsPrice]);

  const newSizeHandler = (newSizeValue, pId, sizes, name, image) => {
    setNewSize(newSizeValue);
    const i = sizes.findIndex((x) => x.size === newSizeValue.toString());

    if (newProducts.some((x) => x.product === pId)) {
      const sameIndex = newProducts.findIndex((x) => x.product === pId);
      newProducts[sameIndex].size = newSizeValue;
    } else {
      setNewProducts([
        ...newProducts,
        {
          product: pId,
          _id: sizes[i]._id,
          price: sizes[i].price,
          name: name,
          image: image,
          size: newSizeValue,
          tax: sizes[i].tax,
          qty: 1,
        },
      ]);
    }

    setCountInStockIndex(
      sizes.findIndex((x) => x.size === newSizeValue.toString())
    );

    setProductId(pId);
  };

  const newQtyHandler = (newQtyValue, pId) => {
    setNewQty(newQtyValue);
    const newIndex = newProducts.findIndex((x) => x.product === pId);
    newProducts[newIndex].qty = Number(newQtyValue);

    setProductId(pId);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    dispatch(
      editOrder({
        orderId,
        shippingAddress: { postalCode, address, city, country },
        modifiedOrderItems,
        itemsPrice,
        totalPrice,
      })
    );
  };

  const closeEditModalHandle = () => {
    setShowEditModal(false);
  };

  const saveChangesHandler = () => {
    if (size) {
      modifiedOrderItems[index].price = productSizes[editIndex].price;
      modifiedOrderItems[index].countInStock =
        productSizes[editIndex].countInStock;
      modifiedOrderItems[index].tax = productSizes[editIndex].tax;
      modifiedOrderItems[index].size = size;
      modifiedOrderItems[index].qty = qty;

      setQty(1);
    }

    setItemsPrice(
      Number(
        modifiedOrderItems
          .reduce(
            (acc, item) => acc + item.price * item.qty + Number(item.tax),
            0
          )
          .toFixed(2)
      )
    );
    setCountInStock(1);
    setShowEditModal(false);
  };

  const showEditModalHandle = (id, oldSize, currIndex, qtyValue) => {
    setSize(oldSize);
    setIndex(currIndex);
    setQty(qtyValue);
    dispatch(listProductDetailsById(id));

    setShowEditModal(true);
  };

  const sizeChangeHandle = (e) => {
    setSize(e.target.value);
    setEditIndex(productSizes.findIndex((x) => x.size === e.target.value));
  };

  const closeNewProductModalHandle = () => {
    setShowNewProductModal(false);
  };

  const showNewProductModalHandle = () => {
    setShowNewProductModal(true);
    history.push(`/admin/order/${orderId}/edit`);

    setSchool('');
    dispatch(listProducts('', pageNumber, '', '', '', school));
  };
  useEffect(() => {
    dispatch(listProducts('', pageNumber, '', '', '', school));
  }, [pageNumber, dispatch, school]);

  const saveNewItemsHandler = () => {
    setModifiedOrderItems([...modifiedOrderItems, ...newItemsToAdd]);
    setShowNewProductModal(false);
    setNewItemsToAdd([]);
    setNewSize('');
    setNewQty('');
  };

  const showTrackingHandle = () => {
    setShowTracking(true);
  };

  const closeTrackingHandle = () => {
    setShowTracking(false);
  };

  const SaveNewItemsButton = () => (
    <Button className='my-3' variant='primary' onClick={saveNewItemsHandler}>
      Save Changes
    </Button>
  );

  const SaveChangesButton = () => (
    <Button
      className='my-3 float-end'
      variant='primary'
      onClick={saveChangesHandler}
    >
      Save Changes
    </Button>
  );

  useEffect(() => {
    if (schoolNames) {
      setOptions(schoolNames);
      setIsLoading(false);
    }
  }, [schoolNames]);

  const handleChange = (item) => {
    if (item.length > 0) {
      history.push(`/admin/order/${orderId}/edit`);
      setSchool(item[0].name);
    } else {
      setSchool('');
    }
  };

  const handleSearch = (query) => {
    setIsLoading(true);
    dispatch(listSchoolNames(query));
  };
  const filterBy = () => true;

  return (
    <AdminPageLayout>
      <Meta
        title={`Order Edit #${order ? order.orderId : ''} - Allschooluniform`}
        description={'Order Edit'}
        keyword={
          'cheap,sell,buy,allschooluniform,new,buyback,unform,online,login,order,details'
        }
      />
      <DialogBox
        handleClose={closeEditModalHandle}
        show={showEditModal}
        title='Edit Item'
        footer={<SaveChangesButton />}
      >
        <Row>
          <Col md={6}>
            <FloatingLabel label='Size' controlId='size'>
              <Form.Select value={size} onChange={(e) => sizeChangeHandle(e)}>
                {productSizes
                  .sort((a, b) => {
                    return a.size - b.size;
                  })
                  .map((x) => (
                    <option value={x.size} key={x.size}>
                      {x.size}
                    </option>
                  ))}
              </Form.Select>
            </FloatingLabel>
          </Col>
          <Col md='6'>
            <FloatingLabel label='Qty' controlId='qty'>
              <Form.Select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              >
                {[...Array(countInStock).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </Form.Select>
            </FloatingLabel>
          </Col>
        </Row>
      </DialogBox>

      <DialogBox
        handleClose={closeNewProductModalHandle}
        show={showNewProductModal}
        title='Add New Product'
        fullscreen={true}
        footer={<SaveNewItemsButton />}
      >
        <div className='mb-5'>
          <AsyncTypeahead
            filterBy={filterBy}
            id='async-example'
            isLoading={isLoading}
            labelKey={'name'}
            minLength={3}
            onChange={(value) => handleChange(value)}
            onSearch={handleSearch}
            options={options}
            placeholder='Enter School Name..'
          />
        </div>

        {message && <Message variant='danger'>{message}</Message>}
        {loadingProducts ? (
          <Loader />
        ) : errorProducts ? (
          <Message variant='danger'>{errorProducts}</Message>
        ) : (
          <>
            <MaterialTable
              style={{ padding: '1%' }}
              title='Products'
              data={products.filter((x) => x.isActive === true)}
              columns={newProductColumns}
              options={{
                rowStyle: {
                  color: 'black',
                  border: '1px solid grey',
                },
                actionsColumnIndex: -1,
                paging: false,
                selection: true,
                showTextRowsSelected: false,
                showSelectAllCheckbox: false,
                selectionProps: (rowData) => ({
                  checked:
                    newItemsToAdd &&
                    newItemsToAdd.some((x) => x.product === rowData._id),
                  color: 'primary',
                }),
              }}
              onSelectionChange={(data, selection) => {
                if (!newSize) {
                  setMessage('Please Select Size!!');
                } else if (!newQty) {
                  setMessage('Please Select Qty');
                } else {
                  setNewItemsToAdd([
                    ...newProducts.filter((addedItem) =>
                      data.some(
                        (itemToAdd) => addedItem.product === itemToAdd._id
                      )
                    ),
                  ]);

                  setMessage('');
                }
              }}
            />
            <Paginate
              orderEdit='true'
              pages={pages}
              page={page}
              isAdmin='true'
              orderId={orderId}
            />
          </>
        )}
      </DialogBox>
      <DialogBox
        handleClose={closeTrackingHandle}
        show={showTracking}
        title='Edit Tracking Details'
      >
        <Row>
          <Form>
            {errorConfirm ? (
              <Message variant='danger'>{errorConfirm}</Message>
            ) : errorProcessing ? (
              <Message variant='danger'>{errorProcessing}</Message>
            ) : errorOutForDelivery ? (
              <Message variant='danger'>{errorOutForDelivery}</Message>
            ) : (
              errorDeliver && <Message variant='danger'>{errorDeliver}</Message>
            )}
            {loadingDeliver ||
            loadingConfirm ||
            loadingOutForDelivery ||
            loadingProcessing ? (
              <Loader />
            ) : (
              <Row>
                <Col xs={6}>
                  <Form.Check
                    disabled={isConfirmed}
                    checked={isConfirmed}
                    type='switch'
                    id='custom-switch'
                    label='Mark As Confirmed'
                    onChange={(e) => dispatch(confirmOrder(order))}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Check
                    disabled={isProcessing}
                    checked={isProcessing}
                    type='switch'
                    id='custom-switch'
                    label='Mark As Processing'
                    onChange={(e) => dispatch(processOrder(order))}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Check
                    disabled={isOutForDelivery}
                    checked={isOutForDelivery}
                    type='switch'
                    id='custom-switch'
                    label='Mark As Out For Delivery'
                    onChange={(e) => dispatch(outForDeliveryOrder(order))}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Check
                    disabled={isDelivered}
                    checked={isDelivered}
                    type='switch'
                    id='custom-switch'
                    label='Mark As Delivered'
                    onChange={(e) => dispatch(deliverOrder(order))}
                  />
                </Col>{' '}
              </Row>
            )}
          </Form>
        </Row>
      </DialogBox>

      <Link to='/admin/orderlist' className='btn btn-outline-dark my-3'>
        Go Back
      </Link>
      <Container>
        <h1>EDIT ORDER</h1>
        <h5>ORDER ID:{orderNumber}</h5>
        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant='warning'>{errorUpdate}</Message>}
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Row>
              <Col md={4} className='mb-3'>
                <Button
                  variant='outline-warning'
                  className='col-12 mb-3'
                  onClick={showTrackingHandle}
                >
                  EDIT TRACKING DETAILS
                </Button>
                <FloatingLabel className='mb-3' controlId='email' label='Email'>
                  <Form.Control
                    className='mb-3'
                    required
                    readOnly
                    type='email'
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>

                <FloatingLabel className='mb-3' label='Name' controlId='name'>
                  <Form.Control
                    className='mb-3'
                    required
                    readOnly
                    type='name'
                    placeholder='Enter Name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel
                  className='mb-3'
                  controlId='phone'
                  label='Mobile'
                >
                  <Form.Control
                    className='mb-3'
                    required
                    readOnly
                    type='phone'
                    placeholder='Enter Mobile '
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <LinkContainer to={`/admin/user/${order.user._id}/edit`}>
                  <Button variant='outline-dark' className='col-12 mb-3'>
                    EDIT USER DETAILS
                  </Button>
                </LinkContainer>
                <h6>Shipping Address</h6>
                <FloatingLabel
                  className='mb-3'
                  label='Address'
                  controlId='address'
                >
                  <Form.Control
                    required
                    type='text'
                    placeholder='Enter Address'
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel className='mb-3' label='City' controlId='city'>
                  <Form.Control
                    required
                    type='text'
                    placeholder='City'
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel
                  className='mb-3'
                  label='Postal Code'
                  controlId='postalCode'
                >
                  <Form.Control
                    required
                    type='text'
                    placeholder='Postal Code'
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>

                <FloatingLabel
                  className='mb-3'
                  label='Country'
                  controlId='country'
                >
                  <Form.Control
                    required
                    type='text'
                    placeholder='Country'
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <FloatingLabel
                  className='mb-3'
                  label='Payment Method'
                  controlId='paymentMethod'
                >
                  <Form.Control
                    required
                    type='text'
                    readOnly
                    placeholder='Payment Method'
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  ></Form.Control>
                </FloatingLabel>
                <Row>
                  <Col>
                    <InputGroup>
                      <InputGroup.Text>Paid</InputGroup.Text>
                      <InputGroup.Text>
                        {' '}
                        {order.isPaid ? (
                          <i
                            className='fas fa-check'
                            style={{ color: 'green' }}
                          ></i>
                        ) : (
                          <i
                            className='fas fa-times'
                            style={{ color: 'red' }}
                          ></i>
                        )}
                      </InputGroup.Text>
                    </InputGroup>
                  </Col>
                  <Col>
                    <InputGroup>
                      <InputGroup.Text>Delivered</InputGroup.Text>
                      <InputGroup.Text>
                        {' '}
                        {order.tracking.isDeliverd ? (
                          <i
                            className='fas fa-check'
                            style={{ color: 'green' }}
                          ></i>
                        ) : (
                          <i
                            className='fas fa-times'
                            style={{ color: 'red' }}
                          ></i>
                        )}
                      </InputGroup.Text>
                    </InputGroup>
                  </Col>
                </Row>
              </Col>
              <Col md={8}>
                <Row className='mb-3'>
                  <Col>
                    {!modify && (
                      <Button
                        className='float-end'
                        variant='outline-info'
                        onClick={() => setModify(true)}
                      >
                        MODIFY ITEMS
                      </Button>
                    )}
                  </Col>
                </Row>
                <Form.Group controlId='orderItems' className='mb-3'>
                  {order.orderItems.length > 0 && (
                    <MaterialTable
                      title='Order Items'
                      columns={orderItemColumns}
                      data={
                        orderItems &&
                        orderItems.sort((a, b) =>
                          a.name > b.name ? 1 : b.name > a.name ? -1 : 0
                        )
                      }
                      options={{
                        rowStyle: {
                          color: 'black',
                        },
                        cellStyle: {
                          textAlign: 'center',
                        },
                        headerStyle: {
                          textAlign: 'center',
                        },

                        paging: false,
                      }}
                    />
                  )}
                </Form.Group>

                <Form.Group controlId='mofifiedOrderItems' className='mb-3'>
                  {modify && modifiedOrderItems.length > 0 && (
                    <Row>
                      <Col>
                        <Button
                          variant='outline-info'
                          className='my-3 float-end '
                          onClick={showNewProductModalHandle}
                        >
                          <i className='fas fa-plus' /> ADD PRODUCT
                        </Button>
                      </Col>
                    </Row>
                  )}
                  {modify && modifiedOrderItems.length > 0 && (
                    <MaterialTable
                      title='Modified Order Items'
                      columns={orderItemColumns}
                      data={modifiedOrderItems}
                      options={{
                        rowStyle: {
                          color: 'black',
                        },
                        actionsColumnIndex: -1,
                        paging: false,
                      }}
                      editable={{
                        onRowDelete: (oldData) =>
                          new Promise((resolve, reject) => {
                            setTimeout(() => {
                              const dataDelete = [...modifiedOrderItems];
                              const oldDataIndex = oldData.tableData.id;
                              dataDelete.splice(oldDataIndex, 1);
                              setModifiedOrderItems([...dataDelete]);

                              resolve();
                            }, 1000);
                          }),
                      }}
                      actions={[
                        {
                          icon: 'edit',
                          tooltip: 'Edit',
                          onClick: (event, rowData) => {
                            showEditModalHandle(
                              rowData.product,
                              rowData.size,
                              rowData.tableData.id,
                              rowData.qty
                            );
                          },
                        },
                      ]}
                    />
                  )}
                </Form.Group>
                <Form.Group controlId='totalPrice'>
                  <Col md={4} className='float-end mb-3'>
                    <Card>
                      <ListGroup variant='flush'>
                        <ListGroup.Item>
                          <h2>ORDER SUMMARY</h2>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <Row>
                            <Col>Items</Col>
                            <Col>₹{itemsPrice}</Col>
                          </Row>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <Row>
                            <Col>Shipping</Col>
                            <Col>₹ {order.shippingPrice}</Col>
                          </Row>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <Row>
                            <Col>Tax</Col>
                            <Col>₹ {order.taxPrice}</Col>
                          </Row>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <Row>
                            <Col>Total</Col>
                            <Col>₹ {totalPrice}</Col>
                          </Row>
                        </ListGroup.Item>
                      </ListGroup>
                      {order && (
                        <a href={instance.url} download={`${orderNumber}.pdf`}>
                          <Button variant='dark' className='col-12'>
                            Download Invoice
                          </Button>
                        </a>
                      )}
                    </Card>
                  </Col>
                </Form.Group>
              </Col>
            </Row>

            <Row className='justify-content-md-center'>
              <Col md={5} className='text-center'>
                <Button variant='dark' type='submit' className='col-12'>
                  UPDATE
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
    </AdminPageLayout>
  );
};

export default OrderEditScreen;
