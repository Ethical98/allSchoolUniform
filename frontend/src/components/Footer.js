import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Image } from 'react-bootstrap';
import './css/Footer.css';

const Footer = () => {
    const liStyle = {
        background: "url('/uploads/tie.png') no-repeat",
        backgroundPosition: '0px 4px',
        paddingLeft: '10px'
    };
    const currentYear = new Date().getFullYear();
    return (
        <footer
            className="p-4"
            style={{
                background: `#2c4a77 url("/uploads/seamlessschool-bg.png")`,
                borderTop: '2px solid #ff6a00',
                color: 'white'
            }}
        >
            <Container>
                <Row className="g-0 hr">
                    <Col sm>
                        <ul>
                            <h6>Know Us</h6>
                            <Link to={'/aboutus'}>
                                <li style={liStyle}>About Us</li>
                            </Link>
                            <Link to={'/contactus'}>
                                <li style={liStyle}>Contact Us</li>
                            </Link>
                            <Link to="/policies-and-help-guide#privacy-policy">
                                <li style={liStyle}>Privacy Policy</li>
                            </Link>
                            <Link to="/policies-and-help-guide#terms-and-conditions">
                                <li style={liStyle}>Terms & Conditions</li>
                            </Link>
                        </ul>
                    </Col>
                    <Col sm>
                        <ul>
                            <h6>Shipping & Policies</h6>
                            <Link to="/policies-and-help-guide#payment-methods">
                                <li style={liStyle}>Payment Methods</li>
                            </Link>
                            <Link to="/policies-and-help-guide#cancellations-exchanges-and-returns">
                                <li style={liStyle}>Cancellation, Exchange & Return </li>
                            </Link>
                            <Link to="/policies-and-help-guide#shipping-and-delivery-policy">
                                <li style={liStyle}>Shipping & Tracking </li>
                            </Link>
                            <Link to="/profile">
                                <li style={liStyle}>My Account</li>
                            </Link>
                        </ul>
                    </Col>
                    <Col sm>
                        <ul>
                            <h6>Customer Support</h6>
                            <li className="ms-2">Whatsapp: +91 9654264262</li>
                            <li className="ms-2">Mail us: help@allschooluniform.com</li>
                            <li className="ms-2">Meet Us: (Mon-Sat) 10:00 AM to 6:00 PM</li>
                        </ul>
                    </Col>
                    <Col sm>
                        <ul>
                            <h6>Support</h6>
                            <li>Net Banking</li>
                            <li>Credit/Debit Cards</li>
                            <li>Cash Cards</li>
                            <li>Cheque/Demand Draft</li>
                        </ul>
                    </Col>
                </Row>
                <hr className="divider"></hr>
                <Row className="m-0">
                    <Col>
                        <p>&copy;2013-{currentYear} AllSchoolUniform</p>
                    </Col>

                    <Col className="me-auto">
                        <Image className="float-end payment-logo" rounded src="/uploads/cod.png" />
                        <Image className="float-end payment-logo" rounded src="/uploads/netbanking.png" />
                        <Image className="float-end payment-logo" src="/uploads/visa.png" />
                        <Image className="float-end payment-logo" src="/uploads/mastercard.png" />
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
