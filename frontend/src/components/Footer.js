import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import './Footer.css';

const Footer = () => {
  const liStyle = {
    background: "url('uploads/tie.png') no-repeat",
    backgroundPosition: '0px 4px',
    paddingLeft: '10px',
  };
  return (
    <footer
      className='mt-5 p-4'
      style={{
        background: `#2c4a77 url("uploads/seamlessschool-bg.png")`,
        borderTop: '2px solid #ff6a00',
        color: 'white',
      }}
    >
      <Container>
        <Row className='g-0 hr'>
          <Col md>
            <ul>
              <h6>Know Us</h6>
              <li style={liStyle}>About Us</li>
              <li style={liStyle}>Contact Us</li>
              <li style={liStyle}>Merchant Partners</li>
              <li style={liStyle}>Privacy Policy</li>
              <li style={liStyle}>Terms & Conditions</li>
            </ul>
          </Col>
          <Col md>
            <ul>
              <h6>Shipping & Policies</h6>
              <li style={liStyle}>FAQs</li>
              <li style={liStyle}>Payment Methods</li>
              <li style={liStyle}>Cancellation, Exchange & Return </li>
              <li style={liStyle}>Shipping & Tracking </li>
              <li style={liStyle}>Vouchers Terms and Conditions</li>
            </ul>
          </Col>
          <Col md>
            <ul>
              <h6>Customer Support</h6>
              <li style={liStyle}>My Account</li>
              <li className='ms-2'>Talk to Us: (011) 49188800</li>
              <li className='ms-2'>Mail us: help@allschooluniform.com</li>
              <li className='ms-2'>Meet Us: (Mon-Sat) 10:00 AM to 6:00 PM</li>
            </ul>
          </Col>
          <Col md>
            <ul>
              <h6>Support</h6>
              <li> Net Banking</li>
              <li>Credit/Debit Cards</li>
              <li> Cash Cards</li>
              <li>Cheque/Demand Draft</li>
            </ul>
          </Col>
        </Row>
        <hr className='divider'></hr>
        <Row className='m-0'>
          <Col>
            <p>&copy;2013-2021 AllSchoolUniform</p>
          </Col>

          <Col className='me-auto'>
            <Image
              className='float-end payment-logo'
              rounded
              src='uploads/cod.png'
            />
            <Image
              className='float-end payment-logo'
              rounded
              src='uploads/netbanking.png'
            />
            <Image className='float-end payment-logo' src='uploads/visa.png' />
            <Image
              className='float-end payment-logo'
              src='uploads/mastercard.png'
            />
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
