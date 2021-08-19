import React from 'react';
import { Link } from 'react-router-dom';
import { Carousel, Image } from 'react-bootstrap';
import './css/CarouselHomeScreen.css';

const CarouselHomeScreen = ({ items = [] }) => {
  return (
    <Carousel
      pause='hover'
      className='bg-dark banner-carousel'
      style={{ zIndex: 1 }}
    >
      {items.map((x, index) => (
        <Carousel.Item key={index}>
          <Link to={'/products'}>
            <Image src={x} alt={`image${index}`} fluid />
            <Carousel.Caption className='carousel-caption'>
              <h2>{'hello'}</h2>
            </Carousel.Caption>
          </Link>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default CarouselHomeScreen;
