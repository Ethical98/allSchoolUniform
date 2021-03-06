import React from 'react';
import { Link } from 'react-router-dom';
import { Carousel, Image } from 'react-bootstrap';
import './css/CarouselHomeScreen.css';

const CarouselHomeScreen = ({ items = [] }) => {
    return (
        <Carousel pause="hover" className="bg-dark banner-carousel" style={{ zIndex: 0 }}>
            {items
                .sort((a, b) => {
                    return a.displayOrder - b.displayOrder;
                })
                .map(
                    (x, index) =>
                        x.isActive && (
                            <Carousel.Item key={index}>
                                <Link to={'/products'}>
                                    <Image src={x.image} alt={`image${index}`} fluid />
                                </Link>
                            </Carousel.Item>
                        )
                )}
        </Carousel>
    );
};

export default CarouselHomeScreen;
