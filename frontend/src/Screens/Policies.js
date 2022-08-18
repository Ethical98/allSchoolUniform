import { map } from 'lodash';
import React from 'react';
import BreadCrumb from '../components/BreadCrumb';
import PageLayout from '../components/PageLayout';
import { policies } from '../staticData/policies';

const Policies = () => {
    return (
        <PageLayout>
            <BreadCrumb />
            <div className="policies-container ">
                <div className="policies-index me-5">
                    {map(policies, (item, index) => (
                        <div key={index}>
                            <div className="header">
                                <i className={`${item.icon} me-2`} />
                                <h1>{item.heading}</h1>
                            </div>
                            <ul>
                                {map(item.list, (policy, index) => (
                                    <li key={index}>
                                        <i class="fa-solid fa-angles-right me-2" />
                                        {policy}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="policies-content">
                    <h3>Privacy Policy</h3>
                    <strong>
                        All school Uniform respects the privacy of every individual using its website for any purpose
                        and committed to protect their personal data with it.
                    </strong>
                    <p>
                        Our Privacy Statement is given below . For any queries or suggestions write to us on
                        help@allschooluniform.com
                    </p>
                    <strong>Personal Details</strong>
                    <p>
                        On using our website either for purchasing / enrolling as vendor or for any other purpose we
                        will obviously require your Name, Address, Mobile No. , Email Address , etc. or any other
                        personal data to revert back to you for your order/queries.
                    </p>
                    <p>
                        Any information saved on ALLSCHOOLUNIFORM.COM will be kept highly confidential. We will use his
                        information only to fulfil your order or your queries. It may further be use to notify about our
                        offers, New products or seeking your valuable suggestions for improving our website.
                    </p>
                    <p>
                        This information can also be use for preparing Analysis of website in terms of No. Of Users, No.
                        Of Visitors, Reviews,etc not effecting your identity.
                    </p>
                    <strong>Does All School Uniform ever share user’s Personal Information</strong>
                    <p>
                        In no circumstances All School Uniform share the user’s information with any other Media ,
                        without seeking your permission except for the promotion of its own website or any other sub
                        unit of All School Uniform. Under extreme occasions when the law requires us to make a
                        divulgence.
                    </p>
                    <strong>Disclaimer</strong>
                    <p>All the Logo / Trademark / Brand Names are of their respective Schools /Manufacturer.</p>
                    <h3>Disclaimer Policy</h3>
                    <p>
                        All product and company names are trademarks™ or registered® trademarks of their respective
                        holders. Use of them does not imply any affiliation with or endorsement by them.
                    </p>
                    <p>All Uniform Rates/ Specficiations are subject to change without notice.</p>
                    <h3>Cancellation, Exchange & Return</h3>
                    <strong>
                        Please note we accept requests for Cancellation / Return of product within 10 days of delivery
                        of the product.
                    </strong>
                    <strong>What Should I do to CANCEL my Order ?</strong>
                    <p>
                        You can cancel your order any time before the shipping of your product. You can write to us at
                        help@allschooluniform.com else call us or you cancel your order from My Orders before shipment.
                    </p>
                    <p>
                        We take 1-2 business days to cancel your order and initiate refund if applicable. You will be
                        intimated by email /sms once cancellation is complete.
                    </p>
                    <strong>How do I will get the refund ? </strong>
                    <p>
                        If you cancel before your order has been shipped you will get your money back within 3-7 working
                        days. If you cancel after your order has been delivered, you will get your money back 3-7 days
                        after we receive back the cancelled products in our warehouse. The refund amount will be
                        credited in the same account as you had made the payment from. Refunds can also be credited in
                        your account with All School Uniform which you can use to purchase any other product from All
                        School Uniform.
                    </p>
                    <strong>How do I will get the refund in case of COD? </strong>
                    <p>
                        In case of COD payments are refunded thru NEFT. You have to provide us Bank Name / Branch Name /
                        IFSC Code. Payment will refunded in 3-5 days after we receive back the goods.
                    </p>
                    <strong> How to return goods if case of Cancellation ? </strong>
                    <p>
                        Please follow the instructions in the cancelation email. You have to send the products in
                        original packing with the invoice or order details. If you paid thru COD please provide your
                        back account details asap. NOTE:- We do NOT process any refunds in form of Cash/ cheque or
                        demand draft. COD payments are refunded only thru NEFT.
                    </p>
                    <strong>How if I want to exchange the product?</strong>
                    <br />
                    <strong>If it before shipment</strong>
                </div>
            </div>
        </PageLayout>
    );
};

export default Policies;
