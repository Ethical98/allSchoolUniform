import React, { useEffect, useState } from 'react';
import {
  Image,
  Container,
  Row,
  Col,
  Figure,
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Meta from '../components/Meta';
import './css/HomeScreen.css';
import Logo2 from '../images/SchoolLogo/Bbps.png';
import Logo3 from '../images/SchoolLogo/aadharshilla.jpg';
import Logo4 from '../images/SchoolLogo/AGS.jpg';
import Logo5 from '../images/SchoolLogo/amity.jpg';
import Logo6 from '../images/SchoolLogo/presentation.png';
import Logo7 from '../images/SchoolLogo/gdgoenka.jpeg';
import { listCarouselImages } from '../actions/homeActions';
import CarouselHomeScreen from '../components/CarouselHomeScreen';
import { listSchoolNames } from '../actions/schoolActions';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

const HomeScreen = ({ history }) => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const carouselImageList = useSelector((state) => state.carouselImageList);
  const { carouselImages } = carouselImageList;

  const schoolNameList = useSelector((state) => state.schoolNameList);
  const { schoolNames } = schoolNameList;

  useEffect(() => {
    dispatch(listCarouselImages());
  }, [dispatch]);

  useEffect(() => {
    if (schoolNames) {
      setOptions(schoolNames);
      setIsLoading(false);
    }
  }, [schoolNames]);

  const handleChange = (item) => {
    history.push(`/products/schools/${item[0].name}`);
  };

  const handleSearch = (query) => {
    setIsLoading(true);
    dispatch(listSchoolNames(query));
  };
  const filterBy = () => true;

  return (
    <div>
      <Header />
      <main>
        <Meta
          description={'Buy School Uniforms Online'}
          keyword={'cheap,sell,buy,allschooluniform,new,buyback,unform,online'}
        />
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
          <div className='mb-5'>

            <AsyncTypeahead
              filterBy={filterBy}
              id='async-example'
              isLoading={isLoading}
              labelKey={'name'}
              minLength={2}
              onChange={(value) => handleChange(value)}
              onSearch={handleSearch}
              options={options}
              placeholder='Enter School Name..'
            />
          </div>
        </Container>
        <CarouselHomeScreen items={carouselImages} />
      </main>
      <Footer />
    </div>
  );
};

export default HomeScreen;
