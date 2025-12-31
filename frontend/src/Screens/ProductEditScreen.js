import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Form, Col, Row, Container, FloatingLabel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { listProductDetailsById, updateProduct, updateFeaturedProduct } from '../actions/productActions';
import { listTypes, listTypeSizes } from '../actions/typeActions';
import { listClasses } from '../actions/classActions';
import { listSchools } from '../actions/schoolActions';
import MaterialTable from 'material-table';
import { logout } from '../actions/userActions';
import { PRODUCT_DETAILS_RESET, PRODUCT_IMAGE_UPLOAD_RESET, PRODUCT_UPDATE_RESET } from '../constants/productConstants';
import Meta from '../components/Meta';
import AdminPageLayout from '../components/AdminPageLayout';
import Paginate from '../components/Paginate';
import ImageUploader from '../components/ImageUploader';
import DialogBox from '../components/DialogBox';

const ProductEditScreen = ({ match, history, location }) => {
    const dispatch = useDispatch();

    const productId = match.params.id;

    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const pageNumber = params.page ? params.page : 1;

    const [showImageUploader, setShowImageUploader] = useState(false);

    const [name, setName] = useState('');
    const [SKU, setSKU] = useState('');
    const [SEOKeywords, setSEOKeywords] = useState(undefined);
    const [image, setImage] = useState('');
    const [type, setType] = useState('');
    const [masterClass, setMasterClass] = useState([]);
    const [standard, setStandard] = useState([]);
    const [schoolName, setSchoolName] = useState([]);
    const [description, setDescription] = useState('');
    // Const [uploading, setUploading] = useState(false);
    const [season, setSeason] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [size, setSize] = useState([]);
    const [message, setMessage] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [outOfStock, setIsOutOfStock] = useState(false);
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isFeatured, setIsFeatured] = useState(false);
    const [featuredOrder, setFeaturedOrder] = useState(0);

    const [masterSize, setMasterSize] = useState([]);

    const [masterType, setMasterType] = useState([]);

    const sizeTableColumns = [
        {
            title: 'Size',
            field: 'size',
            readonly: true
        },
        {
            title: 'InStock',
            field: 'countInStock'
        },
        {
            title: 'Price',
            field: 'price'
        },
        {
            title: 'Opening Qty',
            field: 'openingQty'
        },
        {
            title: 'Alert On Qty',
            field: 'alertOnQty'
        },
        {
            title: 'Discount',
            field: 'discount'
        },
        {
            title: 'Tax',
            field: 'tax'
        },
        {
            title: 'Out Of Stock',
            field: 'outOfStock',
            render: (rowData) => (rowData.outOfStock ? 'YES' : 'NO'),
            editComponent: (props) => (
                <Form.Group controlId="isOutOfStockIndividual" className="mb-3">
                    <Form.Check
                        className="mb-3"
                        type="checkbox"
                        checked={props.value}
                        onChange={(e) => props.onChange(e.target.checked)}
                    ></Form.Check>
                </Form.Group>
            )
        }
    ];

    const schoolTableColumns = [
        {
            title: 'Name',
            field: 'name'
        }
    ];

    const productDetails = useSelector((state) => state.productDetails);
    const { loading, error, product } = productDetails;

    const productUpdate = useSelector((state) => state.productUpdate);
    const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = productUpdate;

    const typeSizesList = useSelector((state) => state.typeSizesList);
    const { loading: loadingMasterSizes, error: errorMasterSizes, masterSizes } = typeSizesList;

    const classList = useSelector((state) => state.classList);
    const { loading: loadingMasterClasses, error: errorMasterClasses, masterClasses } = classList;
    const typeList = useSelector((state) => state.typeList);
    const { masterTypes } = typeList;

    const schoolList = useSelector((state) => state.schoolList);
    const { loading: masterSchoolsLoading, masterSchools, pages, page } = schoolList;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const productImageUpload = useSelector((state) => state.productImageUpload);
    const { url } = productImageUpload;

    useEffect(() => {
        if (!userInfo) {
            history.push('/login');
        }
    }, [history, userInfo]);


    const removeIdHandler = (sizeArray) => {
        const newSizeArray = sizeArray.map(
            ({ price, countInStock, openingQty, tax, discount, size, alertOnQty, isActive, outOfStock }) => ({
                price,
                countInStock,
                openingQty,
                tax,
                discount,
                size,
                alertOnQty,
                isActive,
                outOfStock
            })
        );
        return newSizeArray;
    };

    useEffect(() => {
        if (userInfo && !userInfo.isAdmin) {
            // logout handled by 401 interceptor
            history.push('/login');
        }
    }, [dispatch, history, userInfo]);

    useEffect(() => {
        if (successUpdate) {
            dispatch({ type: PRODUCT_UPDATE_RESET });
            dispatch({ type: PRODUCT_DETAILS_RESET });
            history.push('/admin/productlist');
        } else {
            if (!product.name || product._id !== productId) {
                dispatch(listProductDetailsById(productId));
                dispatch(listClasses());
            } else {
                setType(product.type);
                if (product.type !== type) {
                    dispatch(listTypeSizes(product.type));
                }

                setName(product.name);
                setImage(product.image);
                setSeason(product.season);

                setSize([...product.size]);
                setCategory(product.category);
                setStandard([...product.class]);
                setSchoolName([...product.schoolName]);
                setDescription(product.description);
                setIsActive(product.isActive);
                setBrand(product.brand);
                setSKU(product.SKU);
                setSEOKeywords(product.SEOKeywords);
                setIsOutOfStock(product.outOfStock);
                setDisplayOrder(product.displayOrder || 0);
                setIsFeatured(product.isFeatured || false);
                setFeaturedOrder(product.featuredOrder || 0);
                // If (masterSchools) {
                //   SetMasterSchool([
                //     ...masterSchools.filter((x) => x.isActive === true),
                //   ]);
                // }

                if (masterClasses) {
                    setMasterClass([...masterClasses.filter((x) => x.isActive === true)]);
                }
                if (masterTypes) {
                    setMasterType([...masterTypes.filter((x) => x.isActive === true)]);
                }
            }
        }
        // eslint-disable-next-line
    }, [
        dispatch,
        productId,
        product,
        history,
        // MasterSchools,
        masterClasses,
        masterTypes,
        successUpdate
    ]);

    useEffect(() => {
        dispatch(listSchools(pageNumber));
    }, [dispatch, pageNumber]);

    useEffect(() => {
        if (masterSizes && masterSizes.variants) {
            setMasterSize([...removeIdHandler(masterSizes.variants)]);
        }
    }, [masterSizes, dispatch, product.type]);

    useEffect(() => {
        dispatch(listTypes());
    }, [dispatch]);

    useEffect(() => {
        if (url) {
            setImage(url);
            setShowImageUploader(false);
            dispatch({ type: PRODUCT_IMAGE_UPLOAD_RESET });
        }
    }, [url, dispatch]);

    // Const uploadFileHandler = async (e) => {
    //   Const file = e.target.files[0];

    //   Const formData = new FormData();
    //   FormData.append('image', file);
    //   SetUploading(true);
    //   Try {
    //     Const config = {
    //       Headers: {
    //         'Content-Type': 'multipart/form-data',
    //       },
    //     };

    //     Const { data } = await axios.post('/api/upload', formData, config);

    //     SetImage(data);
    //     SetUploading(false);
    //   } catch (error) {
    //     Console.error(error);
    //     SetUploading(false);
    //   }
    // };

    const submitHandler = (e) => {
        e.preventDefault();
        window.scrollTo(0, 0);
        dispatch(
            updateProduct({
                _id: productId,
                SKU,
                name,
                category,
                brand,
                image,
                size: size.sort((a, b) => (a.size > b.size ? 1 : b.size > a.size ? -1 : 0)),
                type,
                schoolName,
                description,
                season,
                standard,
                isActive,
                SEOKeywords,
                outOfStock,
                displayOrder: Number(displayOrder)
            })
        );
        // Update featured status separately
        dispatch(
            updateFeaturedProduct(productId, {
                isFeatured,
                featuredOrder: Number(featuredOrder)
            })
        );
    };

    useEffect(() => {
        if (masterSize && size) {
            masterSize.forEach((x) => {
                x.price = size.some((y) => y.size === x.size)
                    ? size[size.findIndex((y) => y.size === x.size)].price
                    : 0;
                x.countInStock = size.some((y) => y.size === x.size)
                    ? size[size.findIndex((y) => y.size === x.size)].countInStock
                    : 0;
                x.alertOnQty = size.some((y) => y.size === x.size)
                    ? size[size.findIndex((y) => y.size === x.size)].alertOnQty
                    : 0;
                x.discount = size.some((y) => y.size === x.size)
                    ? size[size.findIndex((y) => y.size === x.size)].discount
                    : 0;
                x.openingQty = size.some((y) => y.size === x.size)
                    ? size[size.findIndex((y) => y.size === x.size)].openingQty
                    : 0;
                x.tax = size.some((y) => y.size === x.size) ? size[size.findIndex((y) => y.size === x.size)].tax : 0;
                x.outOfStock = size.some((y) => y.size === x.size)
                    ? size[size.findIndex((y) => y.size === x.size)].outOfStock
                    : false;
            });
        }
    }, [masterSize, size]);

    const classTableColumns = [
        {
            title: 'Class',
            field: 'class',
            editable: 'never'
        }
    ];

    const closeImageUploaderHandle = () => {
        setShowImageUploader(false);
    };
    const showImageUploaderHandle = () => {
        setImage('');
        setShowImageUploader(true);
    };

    const nameValidationHandler = (value) => {
        setName(value.replace(/[^\w\s]/gi, ''));
    };

    return (
        <AdminPageLayout>
            <Meta title={'Product Edit - AllSchoolUniform'} description={'Edit Product'} />
            <Link to="/admin/productList" className="btn btn-outline-dark my-3">
                Go Back
            </Link>
            <Container>
                <h1>EDIT PRODUCT</h1>
                {loadingUpdate && <Loader />}
                {errorUpdate && <Message variant="warning">{errorUpdate}</Message>}
                {loading ? (
                    <Loader />
                ) : loadingMasterClasses ? (
                    <Loader />
                ) : loadingMasterSizes ? (
                    <Loader />
                ) : error ? (
                    <Message variant="danger">{error}</Message>
                ) : (
                    <Form onSubmit={submitHandler}>
                        <Row>
                            <Col md={3}>
                                <Form.Group controlId="isOutOfStock" className="mb-3">
                                    <Form.Check
                                        className="mb-3"
                                        type="checkbox"
                                        label="Out Of Stock"
                                        checked={outOfStock}
                                        onChange={(e) => setIsOutOfStock(e.target.checked)}
                                    ></Form.Check>
                                </Form.Group>
                                <FloatingLabel controlId="sku" label="SKU" className="mb-3">
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Enter SKU"
                                        value={SKU}
                                        onChange={(e) => setSKU(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                <FloatingLabel controlId="name" label="Name" className="mb-3">
                                    <Form.Control
                                        required
                                        type="name"
                                        placeholder="Enter Name"
                                        value={name}
                                        onChange={(e) => nameValidationHandler(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                <FloatingLabel label="Category" className="mb-3" controlId="category">
                                    <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="Boys">Boys</option>
                                        <option value="Girls">Girls</option>
                                        <option value="Unisex">Unisex</option>
                                    </Form.Select>
                                </FloatingLabel>
                                <FloatingLabel className="mb-3" label="Season" controlId="season">
                                    <Form.Select required value={season} onChange={(e) => setSeason(e.target.value)}>
                                        <option value="Summer">Summer</option>
                                        <option value="Winter">Winter</option>
                                        <option value="All Season">All Season</option>
                                    </Form.Select>
                                </FloatingLabel>

                                <FloatingLabel controlId="brand" label="Brand" className="mb-3">
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Brand "
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>

                                <FloatingLabel controlId="type" label="Product Type" className="mb-3">
                                    <Form.Control
                                        as="select"
                                        required
                                        type="text"
                                        placeholder="Select Type "
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        {masterType &&
                                            masterType.map((x) => (
                                                <option key={x.type} value={x.type}>
                                                    {x.type}
                                                </option>
                                            ))}
                                    </Form.Control>
                                </FloatingLabel>

                                <FloatingLabel controlId="image" label="Image Url" className="mb-3">
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Enter Image url "
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                {/* {uploading && <Loader />}
                <Form.Group controlId='formFile' className='mb-3'>
                  <Form.Label>Upload Image</Form.Label>
                  <Form.Control
                    type='file'
                    custom
                    onChange={uploadFileHandler}
                  />
                </Form.Group> */}
                                <Button
                                    className="col-12 mb-3"
                                    variant="outline-dark"
                                    onClick={showImageUploaderHandle}
                                >
                                    Upload Images
                                </Button>
                                <DialogBox
                                    size={'lg'}
                                    handleClose={closeImageUploaderHandle}
                                    show={showImageUploader}
                                    title={'UPLOAD IMAGES'}
                                >
                                    <ImageUploader product />
                                </DialogBox>

                                <FloatingLabel controlId="description" label="Description" className="mb-3">
                                    <Form.Control
                                        required
                                        as="textarea"
                                        style={{ height: '150px' }}
                                        type="text"
                                        placeholder="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                <FloatingLabel controlId="seoKeywords" label="SEO Keywords" className="mb-3">
                                    <Form.Control
                                        required
                                        as="textarea"
                                        style={{ height: '100px' }}
                                        type="text"
                                        placeholder="SEO Keywords"
                                        value={SEOKeywords}
                                        onChange={(e) => setSEOKeywords(e.target.value)}
                                    ></Form.Control>
                                </FloatingLabel>
                                <Form.Group controlId="isActive" className="mb-3">
                                    <Form.Check
                                        className="mb-3"
                                        type="checkbox"
                                        label="Is Active"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    ></Form.Check>
                                </Form.Group>
                                <FloatingLabel controlId="displayOrder" label="Display Order" className="mb-3">
                                    <Form.Control
                                        type="number"
                                        placeholder="Display Order (higher = appears first)"
                                        value={displayOrder}
                                        onChange={(e) => setDisplayOrder(e.target.value)}
                                    ></Form.Control>
                                    <Form.Text className="text-muted">
                                        Higher values appear first. Use sparse numbering (100, 200, 300...).
                                    </Form.Text>
                                </FloatingLabel>
                                <Form.Group controlId="isFeatured" className="mb-3">
                                    <Form.Check
                                        className="mb-3"
                                        type="checkbox"
                                        label="Featured Product"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                    ></Form.Check>
                                </Form.Group>
                                {isFeatured && (
                                    <FloatingLabel controlId="featuredOrder" label="Featured Order" className="mb-3">
                                        <Form.Control
                                            type="number"
                                            placeholder="Featured Order (lower = appears first)"
                                            value={featuredOrder}
                                            onChange={(e) => setFeaturedOrder(e.target.value)}
                                        ></Form.Control>
                                        <Form.Text className="text-muted">
                                            Lower values appear first in featured section.
                                        </Form.Text>
                                    </FloatingLabel>
                                )}
                            </Col>

                            <Col md={9}>
                                <Row>{message && <Message>{message}</Message>}</Row>
                                <Row>
                                    {errorMasterSizes ? (
                                        <Message variant="warning">{errorMasterSizes}</Message>
                                    ) : (
                                        <Form.Group controlId="size">
                                            {masterSize && (
                                                <MaterialTable
                                                    style={{
                                                        border: '3px solid grey'
                                                    }}
                                                    title="Size Variants"
                                                    data={masterSize.filter((x) => x.isActive === true)}
                                                    columns={sizeTableColumns}
                                                    options={{
                                                        rowStyle: {
                                                            color: 'black'
                                                        },
                                                        cellStyle: {
                                                            border: '2px solid grey'
                                                        },

                                                        paging: false,

                                                        selection: true,
                                                        selectionProps: (rowData) => ({
                                                            checked: size && size.some((x) => x.size === rowData.size),
                                                            color: 'primary'
                                                        }),

                                                        showTextRowsSelected: false,
                                                        actionsColumnIndex: -1
                                                    }}
                                                    onSelectionChange={(data, selection) => {
                                                        if (
                                                            selection &&
                                                            selection.tableData &&
                                                            !selection.tableData.checked
                                                        ) {
                                                            const id = selection.tableData.id;

                                                            const dataDelete = [...size];

                                                            const index = size.findIndex(
                                                                (x) => x.size === masterSize[id].size
                                                            );
                                                            dataDelete.splice(index, 1);
                                                            setSize([...dataDelete]);
                                                        } else if (selection && data) {
                                                            setSize([...new Set([...size, selection])]);
                                                        } else {
                                                            setSize([...data]);
                                                        }
                                                    }}
                                                    editable={{
                                                        onRowUpdate: (newData, oldData) =>
                                                            new Promise((resolve, reject) => {
                                                                setTimeout(() => {
                                                                    setMessage('');
                                                                    const dataUpdate = [...size];
                                                                    const index = size.findIndex(
                                                                        (x) => x.size === oldData.size
                                                                    );
                                                                    if (index !== -1) {
                                                                        dataUpdate[index] = newData;
                                                                        setSize([...dataUpdate]);
                                                                    } else {
                                                                        setMessage('Please Select Size');
                                                                    }

                                                                    resolve();
                                                                }, 1000);
                                                            })
                                                    }}
                                                ></MaterialTable>
                                            )}
                                        </Form.Group>
                                    )}
                                </Row>
                                <Row className="my-3">
                                    <Col md={4}>
                                        {errorMasterClasses ? (
                                            <Message variant="warning">{errorMasterClasses}</Message>
                                        ) : (
                                            <Form.Group controlId="class">
                                                <Form.Label>Class</Form.Label>
                                                {masterClass && (
                                                    <MaterialTable
                                                        style={{
                                                            padding: '1%',
                                                            border: '3px solid grey'
                                                        }}
                                                        title="Class"
                                                        data={masterClass}
                                                        columns={classTableColumns}
                                                        components={{
                                                            Toolbar: () => null
                                                        }}
                                                        options={{
                                                            rowStyle: {
                                                                color: 'black'
                                                            },

                                                            paging: false,
                                                            selection: true,
                                                            search: false,
                                                            selectionProps: (rowData) => ({
                                                                checked: standard.includes(rowData.class),

                                                                color: 'primary'
                                                            })
                                                        }}
                                                        onSelectionChange={(data, selection) => {
                                                            if (
                                                                selection &&
                                                                selection.tableData &&
                                                                !selection.tableData.checked
                                                            ) {
                                                                const id = selection.tableData.id;

                                                                const dataDelete = [...standard];

                                                                const index = standard.findIndex(
                                                                    (x) => x === masterClass[id].class
                                                                );
                                                                dataDelete.splice(index, 1);
                                                                setStandard([...dataDelete]);
                                                            } else if (selection && selection.tableData) {
                                                                const id = selection.tableData.id;
                                                                setStandard([
                                                                    ...new Set([...standard, masterClass[id].class])
                                                                ]);
                                                            } else {
                                                                const allClass = data.map((x) => x.class);
                                                                setStandard([...allClass]);
                                                            }
                                                        }}
                                                    ></MaterialTable>
                                                )}
                                            </Form.Group>
                                        )}
                                    </Col>
                                    <Col>
                                        <Form.Group className="ml-2" controlId="school">
                                            <Form.Label>Schools</Form.Label>
                                            {masterSchoolsLoading ? (
                                                <Loader />
                                            ) : (
                                                masterSchools && (
                                                    <MaterialTable
                                                        data={masterSchools}
                                                        columns={schoolTableColumns}
                                                        style={{
                                                            padding: '1%',
                                                            border: '3px solid grey',
                                                            width: '40vw'
                                                        }}
                                                        components={{
                                                            Toolbar: () => null
                                                        }}
                                                        options={{
                                                            rowStyle: {
                                                                color: 'black'
                                                            },

                                                            paging: false,
                                                            selection: true,
                                                            search: false,
                                                            selectionProps: (rowData) => ({
                                                                checked: schoolName.includes(rowData.name),

                                                                color: 'primary'
                                                            })
                                                        }}
                                                        onSelectionChange={(data, selection) => {
                                                            if (
                                                                selection &&
                                                                selection.tableData &&
                                                                !selection.tableData.checked
                                                            ) {
                                                                const id = selection.tableData.id;

                                                                const dataDelete = [...schoolName];

                                                                const index = schoolName.findIndex(
                                                                    (x) => x === masterSchools[id].name
                                                                );
                                                                dataDelete.splice(index, 1);
                                                                setSchoolName([...dataDelete]);
                                                            } else if (selection && selection.tableData) {
                                                                const id = selection.tableData.id;
                                                                setSchoolName([
                                                                    ...new Set([...schoolName, masterSchools[id].name])
                                                                ]);
                                                            } else {
                                                                const allSchool = data.map((x) => x.name);
                                                                setSchoolName([
                                                                    ...new Set([...schoolName, ...allSchool])
                                                                ]);
                                                            }
                                                        }}
                                                    />
                                                )
                                            )}
                                            <Paginate
                                                editProduct
                                                productId={productId}
                                                pages={pages}
                                                page={page}
                                                isAdmin
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <Row className="justify-content-md-center">
                            <Col md={5} className="text-center">
                                <Button variant="dark" type="submit" className="col-12">
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

export default ProductEditScreen;
