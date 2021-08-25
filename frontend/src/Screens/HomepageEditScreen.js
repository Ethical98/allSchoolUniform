import React, { useEffect, useState, useRef } from 'react';
import { Nav, Tab, Image, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import MaterialTable from 'material-table';
import AdminVerticalNav from '../components/AdminVerticalNav';
import {
  addCarouselImages,
  deleteCarouselImages,
  getHeaderBackgroundDetails,
  getStatisticsDetails,
  listCarouselImages,
  updateCarouselImages,
  updateHeaderBackground,
  updateStatistics,
} from '../actions/homeActions';
import { logout } from '../actions/userActions';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';
import {
  CAROUSEL_IMAGES_ADD_RESET,
  CAROUSEL_IMAGES_UPDATE_RESET,
  HEADER_BG_UPDATE_RESET,
  STATISTICS_UPDATE_RESET,
} from '../constants/homeConstants';
import jsonwebtoken from 'jsonwebtoken';

const HomepageEditScreen = ({ location, history }) => {
  const dispatch = useDispatch();
  const [key, setKey] = useState(
    location.hash ? location.hash.split('#')[1] : 'announcements'
  );

  const carouselImageList = useSelector((state) => state.carouselImageList);
  const { carouselImages, loading, error } = carouselImageList;

  const carouselImageUpdate = useSelector((state) => state.carouselImageUpdate);
  const { success: successUpdate } = carouselImageUpdate;

  const carouselImageDelete = useSelector((state) => state.carouselImageDelete);
  const { success: successDelete } = carouselImageDelete;

  const carouselImageAdd = useSelector((state) => state.carouselImageAdd);
  const { success: successAdd } = carouselImageAdd;

  const statisticsDetails = useSelector((state) => state.statisticsDetails);
  const { loading: loadingStats, error: errorStats, stats } = statisticsDetails;

  const statisticsUpdate = useSelector((state) => state.statisticsUpdate);
  const { success: successUpdateStatistics } = statisticsUpdate;

  const headerBackgroundDetails = useSelector(
    (state) => state.headerBackgroundDetails
  );
  const {
    loading: loadingHeaderbg,
    error: errorHeaderbg,
    headerBackground,
  } = headerBackgroundDetails;

  const headerBackgroundUpdate = useSelector(
    (state) => state.headerBackgroundUpdate
  );
  const { success: successUpdateHeaderBackground } = headerBackgroundUpdate;

  // const [image, setImage] = useState();

  const [bannerImages, setBannerImages] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [headerbg, setHeaderbg] = useState([]);

  let image = '';

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

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
    if (userInfo && !userInfo.isAdmin) {
      dispatch(logout());
      history.push('/login');
    } else {
      if (successUpdate) dispatch({ type: CAROUSEL_IMAGES_UPDATE_RESET });
      if (successAdd) dispatch({ type: CAROUSEL_IMAGES_ADD_RESET });
      dispatch(listCarouselImages());
    }
  }, [dispatch, history, userInfo, successUpdate, successAdd, successDelete]);

  useEffect(() => {
    if (successUpdateStatistics) dispatch({ type: STATISTICS_UPDATE_RESET });
    dispatch(getStatisticsDetails());
  }, [dispatch, successUpdateStatistics]);

  useEffect(() => {
    if (successUpdateHeaderBackground)
      dispatch({ type: HEADER_BG_UPDATE_RESET });
    dispatch(getHeaderBackgroundDetails());
  }, [dispatch, successUpdateHeaderBackground]);

  useEffect(() => {
    if (carouselImages.length > 0) setBannerImages([...carouselImages]);
  }, [carouselImages]);

  useEffect(() => {
    if (stats.length > 0) setStatistics([...stats]);
  }, [stats]);

  useEffect(() => {
    if (headerBackground.length > 0) setHeaderbg([...headerBackground]);
  }, [headerBackground]);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();

    formData.append('image', file);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);
      image = data;
    } catch (error) {
      console.error(error);
    }
  };

  const CarouselImagesColumns = [
    {
      title: '#',
      render: (rowData) => rowData.tableData.id + 1,
    },
    {
      title: 'Image',
      render: (rowData) => (
        <Image src={`${rowData.image}`} className='w-25'></Image>
      ),
    },
    {
      title: 'URL',
      field: 'image',
      editComponent: (props) => (
        <>
          <Form.Group controlId='formFile' className='mb-3'>
            <Form.Label>Upload Image</Form.Label>
            <Form.Control type='file' onChange={uploadFileHandler} />
          </Form.Group>
        </>
      ),
    },
    {
      title: 'Display Order',
      field: 'displayOrder',
      editable: 'onUpdate',
      editComponent: (props) => (
        <Form.Select
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          {[...Array(carouselImages.length).keys()].map((x) => (
            <option key={x + 1} value={x + 1}>
              {x + 1}
            </option>
          ))}
        </Form.Select>
      ),
    },
    {
      title: 'Is Active',
      field: 'isActive',
      render: (rowData) =>
        rowData.isActive ? (
          <i className='fas fa-check'></i>
        ) : (
          <i className='fas fa-times'></i>
        ),
      editComponent: (props) => (
        <Form.Group controlId='isActive' className='mb-3'>
          <Form.Check
            className='mb-3'
            type='checkbox'
            label='Is Active'
            checked={props.value}
            onChange={(e) => props.onChange(e.target.checked)}
          ></Form.Check>
        </Form.Group>
      ),
    },
  ];

  const statsColumns = [
    {
      title: '#',
      render: (rowData) => rowData.tableData.id + 1,
    },
    {
      title: 'Total Parents',
      field: 'totalParents',
    },
    {
      title: 'Total Products',
      field: 'totalProducts',
    },
    {
      title: 'Total Schools',
      field: 'totalSchools',
    },
    {
      title: 'Is Active',
      field: 'isActive',
      render: (rowData) =>
        rowData.isActive ? (
          <i className='fas fa-check'></i>
        ) : (
          <i className='fas fa-times'></i>
        ),
      editComponent: (props) => (
        <Form.Group controlId='isActive' className='mb-3'>
          <Form.Check
            className='mb-3'
            type='checkbox'
            label='Is Active'
            checked={props.value}
            onChange={(e) => props.onChange(e.target.checked)}
          ></Form.Check>
        </Form.Group>
      ),
    },
  ];

  const headerbgcolumns = [
    {
      title: '#',
      render: (rowData) => rowData.tableData.id + 1,
    },
    {
      title: 'Image',
      render: (rowData) => (
        <Image src={`${rowData.image}`} className='w-25'></Image>
      ),
    },
    {
      title: 'URL',
      field: 'image',
      editComponent: (props) => (
        <>
          <Form.Group controlId='formFile' className='mb-3'>
            <Form.Label>Upload Image</Form.Label>
            <Form.Control type='file' onChange={uploadFileHandler} />
          </Form.Group>
        </>
      ),
    },
    {
      title: 'Is Active',
      field: 'isActive',
      render: (rowData) =>
        rowData.isActive ? (
          <i className='fas fa-check'></i>
        ) : (
          <i className='fas fa-times'></i>
        ),
      editComponent: (props) => (
        <Form.Group controlId='isActive' className='mb-3'>
          <Form.Check
            className='mb-3'
            type='checkbox'
            label='Is Active'
            checked={props.value}
            onChange={(e) => props.onChange(e.target.checked)}
          ></Form.Check>
        </Form.Group>
      ),
    },
  ];

  const TabContent = () => (
    <Tab.Content>
      <Tab.Pane eventKey='announcements'>
        <MaterialTable title='Announcements' options={{ paging: false }} />
      </Tab.Pane>
      <Tab.Pane mountOnEnter eventKey='carousel'>
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <div>
            <MaterialTable
              title='Carousel'
              data={bannerImages}
              columns={CarouselImagesColumns}
              options={{ paging: false, actionsColumnIndex: -1 }}
              editable={{
                onRowAdd: (newData) =>
                  new Promise((resolve, reject) => {
                    setTimeout(() => {
                      newData.displayOrder = bannerImages.length + 1;
                      newData.image = image;
                      setBannerImages([...bannerImages, newData]);
                      dispatch(addCarouselImages(newData));
                      image = '';

                      resolve();
                    }, 1000);
                  }),
                onRowUpdate: (newData, oldData) =>
                  new Promise((resolve, reject) => {
                    setTimeout(() => {
                      if (image) {
                        newData.image = image;
                        dispatch(updateCarouselImages(newData));
                      } else {
                        const dataUpdate = [...bannerImages];
                        const index = oldData.tableData.id;
                        dataUpdate[index] = newData;
                        setBannerImages([...dataUpdate]);
                        dispatch(updateCarouselImages(newData));
                      }
                      image = '';

                      resolve();
                    }, 1000);
                  }),
                onRowDelete: (oldData) =>
                  new Promise((resolve, reject) => {
                    setTimeout(() => {
                      const dataDelete = [...bannerImages];
                      const index = oldData.tableData.id;
                      dataDelete.splice(index, 1);
                      setBannerImages([...dataDelete]);
                      dispatch(deleteCarouselImages(oldData._id));

                      resolve();
                    }, 1000);
                  }),
              }}
            />
          </div>
        )}
      </Tab.Pane>
      <Tab.Pane eventKey='statistics'>
        {loadingStats ? (
          <Loader />
        ) : errorStats ? (
          <Message variant='danger'>{errorStats}</Message>
        ) : (
          <MaterialTable
            title='Statistics'
            columns={statsColumns}
            data={statistics}
            options={{ paging: false, actionsColumnIndex: -1 }}
            editable={{
              onRowUpdate: (newData, oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    const dataUpdate = [...statistics];
                    const index = oldData.tableData.id;
                    dataUpdate[index] = newData;
                    setStatistics([...dataUpdate]);
                    console.log(newData);
                    dispatch(updateStatistics(newData));

                    resolve();
                  }, 1000);
                }),
            }}
          />
        )}
      </Tab.Pane>
      <Tab.Pane eventKey='headerbackground'>
        {loadingStats ? (
          <Loader />
        ) : errorStats ? (
          <Message variant='danger'>{errorStats}</Message>
        ) : (
          <MaterialTable
            title='Header Background'
            columns={headerbgcolumns}
            data={headerbg}
            options={{ paging: false, actionsColumnIndex: -1 }}
            editable={{
              onRowUpdate: (newData, oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    if (image) {
                      newData.image = image;
                      
                      dispatch(updateHeaderBackground(newData));
                      image = '';
                    } else {
                      const dataUpdate = [...headerbg];
                      const index = oldData.tableData.id;
                      dataUpdate[index] = newData;
                      setHeaderbg([...dataUpdate]);
                      dispatch(updateHeaderBackground(newData));
                      image = '';
                    }

                    resolve();
                  }, 1000);
                }),
            }}
          />
        )}
      </Tab.Pane>
    </Tab.Content>
  );
  return (
    <div>
      <AdminVerticalNav
        tabContent={<TabContent />}
        currentKey={key}
        setKey={setKey}
      >
        <Nav.Item>
          <Nav.Link href='#announcements' eventKey='announcements'>
            Annoucements
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link href='#carousel' eventKey='carousel'>
            Carousel
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link href='#statistics' eventKey='statistics'>
            Statistics
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey='headerbackground' href='#headerbackground'>
            Header Background
          </Nav.Link>
        </Nav.Item>
      </AdminVerticalNav>
    </div>
  );
};

export default HomepageEditScreen;
