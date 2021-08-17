import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Carousel, CarouselItem, Image } from 'react-bootstrap';
import Loader from './Loader';
import Message from './Message';
import { listCarouselImages } from '../actions/homeActions';
import { useDispatch, useSelector } from 'react-redux';
import './css/CarouselHomeScreen.css';

const CarouselHomeScreen = () => {
  const dispatch = useDispatch();

  const [images, setImages] = useState([]);

  const carouselImageList = useSelector((state) => state.carouselImageList);
  const { loading, carouselImages, error } = carouselImageList;

  useEffect(() => {
    dispatch(listCarouselImages());
  }, [dispatch]);

  return loading ? (
    <Loader />
  ) : error ? (
    <Message varaint='danger'>{error}</Message>
  ) : (
    <Carousel
      pause='hover'
      className='bg-dark banner-carousel'
      style={{ zIndex: 1 }}
    >
      {carouselImages.map((x, index) => (
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
