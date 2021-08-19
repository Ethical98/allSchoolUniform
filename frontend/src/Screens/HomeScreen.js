import React, { useEffect, useState } from 'react';
import { Image, Container, Row, Col, Figure } from 'react-bootstrap';
import { Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Meta from '../components/Meta';
import './css/HomeScreen.css';
import Logo2 from '../images/SchoolLogo/Bbps.png';
import Logo3 from '../images/SchoolLogo/aadharshilla.jpg';
import Logo4 from '../images/SchoolLogo/AGS.jpg';
import Logo5 from '../images/SchoolLogo/amity.jpg';
import Logo6 from '../images/SchoolLogo/presentation.png';
import Logo7 from '../images/SchoolLogo/gdgoenka.jpeg';
import SearchBoxAutocomplete from '../components/SearchBoxAutocomplete';
import { listCarouselImages } from '../actions/homeActions';
import CarouselHomeScreen from '../components/CarouselHomeScreen';
import { listSchoolNames } from '../actions/schoolActions';

const HomeScreen = ({ history }) => {
  const dispatch = useDispatch();

  const carouselImageList = useSelector((state) => state.carouselImageList);
  const { carouselImages } = carouselImageList;

  const [schools, setSchools] = useState([]);

  const schoolNameList = useSelector((state) => state.schoolNameList);
  const { schoolNames } = schoolNameList;

  useEffect(() => {
    dispatch(listCarouselImages());
  }, [dispatch]);

  useEffect(() => {
    if (!(schoolNames && schoolNames.length > 0)) {
      dispatch(listSchoolNames());
    } else {
      setSchools([
        ...schoolNames.map((x, index) => ({ id: index, name: x.name })),
      ]);
    }
  }, [dispatch, schoolNames]);

  const handleOnSelect = (item) => {
    history.push(`/products/schools/${item.name}`);
  };

  return (
    <div>
      <Meta />
      <Container>
        <h4 className='text-center'>Commonly Searched Schools</h4>
        <Row>
          <Col>
            <Figure>
              <Image
                className='schoolLogo'
                src='uploads/ImageOne.jpg'
                rounded
              />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo2} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo3} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo4} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo5} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo6} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo7} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo4} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo5} rounded />
              <Figure.Caption
                className='text-center'
                style={{ color: 'white' }}
              >
                Presidium
              </Figure.Caption>
            </Figure>
          </Col>
        </Row>
        <div style={{ zIndex: 4 }}>
          <Route
            render={({ history }) => (
              <SearchBoxAutocomplete
                placeholder={'Search School'}
                history={history}
                items={schools}
                handleOnSelect={handleOnSelect}
              />
            )}
          />
        </div>
      </Container>
      <CarouselHomeScreen items={carouselImages} />

      {/* <Carousel className='mt-5' style={{ zIndex: -1 }}>
        {carouselImages &&
          carouselImages.map((x, index) => (
            <Carousel.Item key={index}>
              <Image rounded className='d-block' src={x} alt='First slide' />
              <Carousel.Caption></Carousel.Caption>
            </Carousel.Item>
          ))} */}

      {/* <Carousel.Item>
          <Image rounded className='d-block ' src={image2} alt='Second slide' />

          <Carousel.Caption></Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <Image rounded className='d-block ' src={image1} alt='Third slide' />

          <Carousel.Caption></Carousel.Caption>
        </Carousel.Item> */}
      {/* </Carousel> */}
    </div>
  );
};

export default HomeScreen;
