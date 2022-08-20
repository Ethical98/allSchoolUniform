import React, { useEffect, useState } from 'react';
import { Image, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Meta from '../components/Meta';
import './css/HomeScreen.css';
import { listCarouselImages } from '../actions/homeActions';
import { listSchoolNames } from '../actions/schoolActions';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import useMedia from '../utils/useMedia';
import {  join, lowerCase, sortBy, split } from 'lodash';

const HomeScreen = ({ history }) => {
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const schoolNameList = useSelector((state) => state.schoolNameList);
    const { schoolNames } = schoolNameList;

    useEffect(() => {
        dispatch(listCarouselImages());
    }, [dispatch]);

    useEffect(() => {
        if (schoolNames) {
            setOptions(sortBy(schoolNames, (item) => item.name));
            setIsLoading(false);
        }
    }, [schoolNames]);

    const handleChange = (item) => {
        const school = join(split(lowerCase(item[0].name), ' '), '-');

        history.push(`/products/schools/${school}`);
    };

    const handleSearch = (query) => {
        setIsLoading(true);
        dispatch(listSchoolNames(query));
    };
    const filterBy = () => true;

    const mediaType = useMedia(
        // Media queries
        ['(max-width: 767px)', '(min-width: 768px) and (max-width: 1024px)', '(min-width: 1025px)'],
        // Column Data (relates to above media queries by array index)
        ['MOBILE', 'TABLET', 'DESKTOP']
    );

    return (
        <div>
            <Header />
            <main>
                <Meta
                    description={'Buy School Uniforms Online'}
                    keywords={
                        'cheap,sell,buy,allschooluniform,new,buyback,unform,online,GD Goenka Public School,GD,schools,school,presidium,bal bharati public school,dps,kendriya vidyalya,dav,all,smart,air force,uniforms,public'
                    }
                />
                <div className="body-wrapper">
                    <div className="banner-section">
                        <div className="search-wrapper">
                            <img className="look-icon" src="/uploads/asu-look-icon.png" alt="looking-for" />
                            <InputGroup>
                                <AsyncTypeahead
                                    filterBy={filterBy}
                                    id="async-example"
                                    isLoading={isLoading}
                                    labelKey={'name'}
                                    minLength={2}
                                    onChange={(value) => handleChange(value)}
                                    onSearch={handleSearch}
                                    options={options}
                                    placeholder={'Search School Name...'}
                                    size={mediaType === 'DESKTOP' ? 'lg' : 'sm'}
                                    autoFocus
                                />
                            </InputGroup>
                        </div>
                        <Image className="banner-image" src="/uploads/Banner.jpg" alt={'banner-img'} fluid />
                    </div>
                    <div className="stats-section">
                        <div className="item">
                            <h5>Schools</h5>
                            <Image src="/uploads/asu_school_icon.png" alt="total-schools" />
                            <h1>310</h1>
                        </div>
                        <div className="item">
                            <h5>Happy Parents</h5>
                            <Image src="/uploads/asu_prt_icon.png" alt="total-parents" />
                            <h1>15650</h1>
                        </div>
                        <div className="item">
                            <h5>Products</h5>
                            <Image src="/uploads/asu_pro_icon.png" alt="total-products" />
                            <h1>645</h1>
                        </div>
                    </div>
                    <hr />
                    <div className="join-us-section">
                        <p>JOIN US NO OBLIGATION</p>
                        <div className="features">
                            <div className="feature">
                                <Image src="/uploads/home-delivery.png" alt="free-home-delivery" />
                                <h4>Free Home Delivery</h4>
                                <p>No minimum orders or commitment. Buy what you need</p>
                            </div>
                            <div className="feature">
                                <Image src="/uploads/replacement.png" alt="free-replacement" />
                                <h4>7 Day Replacement</h4>
                                <p>Alter Size with in 7 days of Purchase absolutely free.</p>
                            </div>
                            <div className="feature">
                                <Image src="/uploads/asu-cash-on-delivery.png" alt="cash-on-delivery" />
                                <h4>Cash On Delivery</h4>
                                <p>Pay Cash after receiving goods</p>
                            </div>
                            <div className="feature">
                                <Image src="/uploads/buy-back.png" alt="buy-back" />
                                <h4>Buy Back</h4>
                                <p>
                                    We will buy your old uniform and give you Cash Voucher which can be used to buy item
                                    from our Website
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="folks-talk-section">
                        <p>FOLKS TALK</p>
                        <div className="reviews">
                            <div className="review">
                                <h4>Samir: JanakPuri</h4>
                                <p>Great Job. end of woes of buying School Uniform.</p>
                            </div>
                            <div className="review">
                                <h4>Bhavna: Patel Nagar</h4>
                                <p>
                                    Now even my kids can buy uniform without worrying of Quality, Prices . Kudos to You
                                </p>
                            </div>
                            <div className="review">
                                <h4>Vijay: Karol Bagh</h4>
                                <p>Stuff is Great.Excellent Delivery Keep it Up !</p>
                            </div>
                            <div className="review">
                                <h4>Rishi: Pitampura</h4>
                                <p>Love the in on-line School Uniform ordering service. Thx Allschooluniform.</p>
                            </div>
                        </div>
                    </div>
                    <div className="contact-us-section">
                        <h5>FEEL FREE TO CONTACT US</h5>
                        <p>You can find us literally anywhere, just push a button and we are there</p>
                        <div className="social-media-icons">
                            <a href="https://www.facebook.com/allschoolsuniform/">
                                <i class="fa-brands fa-facebook-square">
                                    <p>Facebook</p>
                                </i>
                            </a>
                            <a href="https://twitter.com/allschooluni4m">
                                <i class="fa-brands fa-twitter-square">
                                    <p>Twitter</p>
                                </i>
                            </a>
                            <a href="https://wa.me/919654264262">
                                <i class="fa-brands fa-whatsapp-square">
                                    <p>Whatsapp</p>
                                </i>
                            </a>
                        </div>
                        <p>Follow us for updates and latest offer.</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default HomeScreen;
