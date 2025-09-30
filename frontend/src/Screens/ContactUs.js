import React from 'react';
import PageLayout from '../components/PageLayout';
import BreadCrumb from '../components/BreadCrumb';

const ContactUs = () => {
    return (
        <PageLayout>
            <BreadCrumb />
            <div class="Ad-box">
                <h5>
                    <i className="fa fa-location-dot me-2"></i>
                    <span>Our Main Office Address:</span>
                </h5>
                <address class="mgl10">
                    Active Mindz
                    <br />
                    Udyog Vihar, Sector 18
                    <br /> Gurgoan (Haryana)
                </address>
                <h5>
                    <i className="fa fa-phone me-2"></i>
                    <span>Whatsapp us on :</span>
                </h5>
                <address class="mgl10">+91-9654264262</address>
                <p>
                    If you have any query, please go ahead and whatsapp us @+91-9654264262 between 10 AM & 6 PM .You can
                    also mail us at <a href="mailto:help@allschooluniform.com">help@allschooluniform.com </a> and we'll
                    be happy to assist you.
                </p>
            </div>
        </PageLayout>
    );
};

export default ContactUs;
