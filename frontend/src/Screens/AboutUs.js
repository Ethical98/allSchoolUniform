import React from 'react';
import { Image } from 'react-bootstrap';
import BreadCrumb from '../components/BreadCrumb';
import PageLayout from '../components/PageLayout';

const AboutUs = () => {
    return (
        <PageLayout>
            <BreadCrumb />
            <div className="aboutus-container">
                <Image src="/uploads/extras/aboutUs.jpg" width={'50%'} />
                <div className="aboutus-text">
                    <h2>About Us</h2>
                    <h6>All School Uniform is an innovative concept induced by Active Mindz</h6>
                    <p>
                        The whole idea came from the trouble I had to deal when I go for shopping Uniforms for my kids
                        at School or other Uniform Outlets. There is a problem of Parking, Different Shades for same
                        uniform, Higher price. I decided to start online selling of Uniforms plus other school related
                        materials at lower price and of premium Quality. Directly buying from factories cut impressive
                        margins of the middlemen, thereby make our prices very competitive in the market.
                    </p>
                    <p>
                        Since our children are growing so uniform gets short every year leaving a so called new uniform
                        useless. In order to manage a little bit of this we have started a BUY-BACK of old uniform and
                        giving credit vouchers for it. This old stuff will be donated to unprivileged children directly.
                    </p>
                    <p>
                        After consultation with various schools this wonderful Online Uniform Shopping portal is
                        introduced.
                    </p>
                    <p>Happy Uniform Buying</p>
                    <p> All School Uniform Team</p>
                </div>
            </div>
        </PageLayout>
    );
};

export default AboutUs;
