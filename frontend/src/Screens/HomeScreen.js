import React from 'react';
import { Carousel, Image, Container, Row, Col, Figure } from 'react-bootstrap';
// import url from '../components/asu-top-logo.png';
import './css/HomeScreen.css';
import image1 from '../homeScreenBanner/ImageOne.jpg';
import image2 from '../homeScreenBanner/ImageTwo.jpg';
import image3 from '../homeScreenBanner/Banner.jpg';
import Logo1 from '../images/SchoolLogo/presidium-logo.jpg';
import Logo2 from '../images/SchoolLogo/Bbps.png';
import Logo3 from '../images/SchoolLogo/aadharshilla.jpg';
import Logo4 from '../images/SchoolLogo/AGS.jpg';
import Logo5 from '../images/SchoolLogo/amity.jpg';
import Logo6 from '../images/SchoolLogo/presentation.png';
import Logo7 from '../images/SchoolLogo/gdgoenka.jpeg';

const HomeScreen = () => {
  return (
    <div>
      <Container>
        <h4 className='text-center'>Commonly Searched Schools</h4>
        <Row>
          <Col>
            <Figure>
              <Image className='schoolLogo' src={Logo1} rounded />
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
      </Container>
      <Carousel className='mt-5'>
        <Carousel.Item>
          <Image rounded className='d-block' src={image3} alt='First slide' />
          <Carousel.Caption></Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <Image rounded className='d-block ' src={image2} alt='Second slide' />

          <Carousel.Caption></Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <Image rounded className='d-block ' src={image1} alt='Third slide' />

          <Carousel.Caption></Carousel.Caption>
        </Carousel.Item>
      </Carousel>
    </div>
  );
};

export default HomeScreen;
