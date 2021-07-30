import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  ListGroup,
  Card,
  InputGroup,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import { getOrderDetails, editOrder } from '../actions/orderActions';
import { USER_UPDATE_RESET } from '../constants/userConstants';
import { logout } from '../actions/userActions';
import Loader from '../components/Loader';
import MaterialTable from 'material-table';
import { LinkContainer } from 'react-router-bootstrap';
import { ListProductDetailsById } from '../actions/productActions';
import { listSchools } from '../actions/schoolActions';
import { listProducts } from '../actions/productActions';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

const OrderEditScreen = ({ history, match }) => {
  const dispatch = useDispatch();
  const orderId = match.params.id;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const orderDetails = useSelector((state) => state.orderDetails);
  const { order, loading, error } = orderDetails;

  const productDetails = useSelector((state) => state.productDetails);
  const { product } = productDetails;

  const productList = useSelector((state) => state.productList);
  const {
    loading: loadingProducts,
    error: errorProducts,
    products,
  } = productList;

  const schoolList = useSelector((state) => state.schoolList);
  const { masterSchools } = schoolList;

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
  const [editModalShow, setEditModalShow] = useState(false);
  const [newProductModalShow, setNewProductModalShow] = useState(false);
  const [modify, setModify] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [school, setSchool] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [masterSchool, setMasterSchool] = useState([]);
  const [countInStockIndex, setCountInStockIndex] = useState(0);
  const [productId, setProductId] = useState('');
  const [editIndex, setEditIndex] = useState(0);
  const [newProducts, setNewProducts] = useState([]);
  const [newItemsToAdd, setNewItemsToAdd] = useState([]);
  const [newQty, setNewQty] = useState(0);
  const [newSize, setNewSize] = useState('');
  const [totalPrice, setTotalPrice] = useState('');

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
    // if (successUpdate) {
    //   dispatch({ type: USER_UPDATE_RESET });
    //   history.push('admin/userlist');
    // } else {
    if (!order || order._id !== orderId) {
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
    // }
  }, [order, orderId, dispatch, history]);

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
    if (newProducts) {
      setFilteredData([...products]);
    }
  }, [products]);

  useEffect(() => {
    if (school) {
      setFilteredData(
        products.filter((x) => x.schoolName.includes(school.toUpperCase()))
      );
    } else {
      setFilteredData([...products]);
    }
  }, [school, products]);

  useEffect(() => {
    if (productSizes.length > 0 && editIndex === 0 && size) {
      setCountInStock(
        productSizes[productSizes.findIndex((x) => x.size === size)]
          .countInStock
      );
    } else if (productSizes.length > 0 && size) {
      setCountInStock(productSizes[editIndex].countInStock);
    } // eslint-disable-next-line
  }, [productSizes, size, editIndex]);

  useEffect(() => {
    if (masterSchools) {
      setMasterSchool([...masterSchools]);
    }
  }, [masterSchools]);

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
    const i = sizes.findIndex((x) => x.size === newSizeValue);

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

  const handleEditModalClose = () => {
    setEditModalShow(false);
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
    setEditModalShow(false);
  };

  const handleEditModalShow = (id, oldSize, currIndex, qtyValue) => {
    setSize(oldSize);
    setIndex(currIndex);
    setQty(qtyValue);
    dispatch(ListProductDetailsById(id));

    setEditModalShow(true);
  };

  const handleSizeChange = (e) => {
    setSize(e.target.value);
    setEditIndex(productSizes.findIndex((x) => x.size === e.target.value));
  };

  const handleNewProductModalClose = () => {
    setNewProductModalShow(false);
  };

  const handleNewProductModalShow = () => {
    setNewProductModalShow(true);
    setSchool('');
    dispatch(listProducts());
  };

  const saveNewItemsHandler = () => {
    setModifiedOrderItems([...modifiedOrderItems, ...newItemsToAdd]);
    setNewProductModalShow(false);
    setNewItemsToAdd([]);
    setNewSize('');
    setNewQty('');
  };
  return (
    <>
      <Modal
        backdrop='static'
        show={editModalShow}
        onHide={handleEditModalClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Product Size</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <FloatingLabel label='Size' controlId='size'>
                <Form.Select value={size} onChange={(e) => handleSizeChange(e)}>
                  {productSizes.map((x) => (
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant='primary' onClick={saveChangesHandler}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        backdrop='static'
        size={'xl'}
        show={newProductModalShow}
        onHide={handleNewProductModalClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message && <Message variant='danger'>{message}</Message>}
          {loadingProducts ? (
            <Loader />
          ) : errorProducts ? (
            <Message variant='danger'>{errorProducts}</Message>
          ) : (
            <MaterialTable
              style={{ padding: '1%' }}
              title='Products'
              data={filteredData}
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
                        (itemToAdd) => addedItem.product == itemToAdd._id
                      )
                    ),
                  ]);

                  setMessage('');
                }
              }}
              actions={[
                {
                  icon: () => (
                    <Autocomplete
                      options={masterSchool}
                      getOptionLabel={(option) => option.name}
                      onChange={(option, value) =>
                        value ? setSchool(value.name) : setSchool('')
                      }
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
                  tooltip: 'Delete Product',
                  isFreeAction: true,
                },
              ]}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='primary' onClick={saveNewItemsHandler}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Link to='/admin/orderlist' className='btn btn-outline-dark my-3'>
        Go Back
      </Link>
      <Container>
        <h1>EDIT ORDER</h1>

        {/* {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant='warning'>{errorUpdate}</Message>} */}
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Row>
              <Col md={4} className='mb-3'>
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
                        {order.isDeleiverd ? (
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
                    <Button
                      className='float-end'
                      variant='outline-info'
                      onClick={() => setModify(true)}
                    >
                      MODIFY ITEMS
                    </Button>
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
                          onClick={handleNewProductModalShow}
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
                            handleEditModalShow(
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
                    </Card>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className='justify-content-md-center'>
              <Col md={3} className='text-center'>
                <Button variant='dark' type='submit' className='col-12'>
                  UPDATE
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
    </>
  );
};

export default OrderEditScreen;
