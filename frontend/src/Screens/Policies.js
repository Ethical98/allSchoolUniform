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
                                    <a href={policy.url} key={index}>
                                        <li>
                                            <i class="fa-solid fa-angles-right me-2" />
                                            {policy.label}
                                        </li>
                                    </a>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="policies-content">
                    <div id="privacy-policy">
                        <h3>Privacy Policy</h3>
                        <strong>
                            All school Uniform respects the privacy of every individual using its website for any
                            purpose and committed to protect their personal data with it.
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
                            Any information saved on ALLSCHOOLUNIFORM.COM will be kept highly confidential. We will use
                            his information only to fulfil your order or your queries. It may further be use to notify
                            about our offers, New products or seeking your valuable suggestions for improving our
                            website.
                        </p>
                        <p>
                            This information can also be use for preparing Analysis of website in terms of No. Of Users,
                            No. Of Visitors, Reviews,etc not effecting your identity.
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
                    </div>
                    <div id="disclaimer-policy">
                        <h3>Disclaimer Policy</h3>
                        <p>
                            All product and company names are trademarks™ or registered® trademarks of their respective
                            holders. Use of them does not imply any affiliation with or endorsement by them.
                        </p>
                        <p>All Uniform Rates/ Specficiations are subject to change without notice.</p>
                    </div>
                    <div id="cancellations-exchanges-and-returns">
                        <h3>Cancellation, Exchange & Return</h3>
                        <strong>
                            Please note we accept requests for Cancellation / Return of product within 10 days of
                            delivery of the product.
                        </strong>
                        <strong>What Should I do to CANCEL my Order ?</strong>
                        <p>
                            You can cancel your order any time before the shipping of your product. You can write to us
                            at help@allschooluniform.com else call us or you cancel your order from My Orders before
                            shipment.
                        </p>
                        <p>
                            We take 1-2 business days to cancel your order and initiate refund if applicable. You will
                            be intimated by email /sms once cancellation is complete.
                        </p>
                        <strong>How do I will get the refund ? </strong>
                        <p>
                            If you cancel before your order has been shipped you will get your money back within 3-7
                            working days. If you cancel after your order has been delivered, you will get your money
                            back 3-7 days after we receive back the cancelled products in our warehouse. The refund
                            amount will be credited in the same account as you had made the payment from. Refunds can
                            also be credited in your account with All School Uniform which you can use to purchase any
                            other product from All School Uniform.
                        </p>
                        <strong>How do I will get the refund in case of COD? </strong>
                        <p>
                            In case of COD payments are refunded thru NEFT. You have to provide us Bank Name / Branch
                            Name / IFSC Code. Payment will refunded in 3-5 days after we receive back the goods.
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
                        <strong>If it before shipment and After Shipment</strong>
                        <p>Call Us on +91-9654264262. We Will Help You Out</p>

                        <strong>Returns</strong>
                        <br />

                        <strong>Can I return the product purchased.?</strong>

                        <p>
                            You can return the product if you received a faulty/defective product / physically damaged
                            product that have not been worn/washed/soiled with their original tags will be accepted.
                        </p>

                        <strong>Will there be any charges for returning product ?</strong>

                        <p>
                            If the product is being returned due to company fault then no amount will be deducted else
                            minimum Rs. 50 will be deducted from invoice amount towards delivery charges. If the
                            delivery type is other than regular then amount will be deducted as per Delivery Schedule
                            and Charges.
                        </p>

                        <strong>How to Return the product.</strong>

                        <p>
                            You can write to us at help@allschooluniform.com else call us on +91-9654264262 and ask to
                            arrange for pick up of products to be returned
                        </p>
                        <p>
                            We may take 1-2 business days to pick up your order and initiate refund if applicable. You
                            will be intimated by email /sms once returned goods reaches our warehouse.
                        </p>
                        <strong>Can I partially return the goods.</strong>
                        <p>
                            Yes you can partially returned the goods that have not been worn/washed/soiled with their
                            original tags. If then the order value becomes less than Rs. 500 then delivery charges will
                            be deducted from the invoice value.
                        </p>

                        <strong>How do I will get the refund in case of return ?</strong>

                        <p>
                            You will get your money back 3-7 days after we receive back the returned products in our
                            warehouse. The refund amount will be credited in the same account as you had made the
                            payment from. Refunds can also be credited in your account with All School Uniform which you
                            can use to purchase any other product from All School Uniform.
                        </p>

                        <strong>How do I will get the refund in case of COD?</strong>

                        <p>
                            In case of COD payments are refunded thru NEFT. You have to provide us Bank Name / Branch
                            Name / IFSC Code. Payment will refunded in 3-5 days after we receive back the goods in our
                            warehouse.
                        </p>
                    </div>
                    <div id="shipping-and-delivery-policy">
                        <h3>Shipping & Delivery Policy</h3>
                        <p>
                            We always aim to deliver your order as fast as possible within 24 hours even more quicker.
                            We deliver all the products throughout the India. Delivery is FREE for orders of Rs. 600 or
                            more Rs.100 per parcel if the order value if Less than Rs. 600.
                        </p>
                    </div>
                    <div id="terms-and-conditions">
                        <h3>Terms and Conditions</h3>
                        <ol>
                            <li>
                                <strong>TERMS AND CONDITIONS</strong>
                                <ul>
                                    <li>
                                        The website ALLSCHOOLUNIFORMS.COM is owned and operated by Active Mindz whose
                                        registered office is at New Delhi
                                    </li>
                                    <li>
                                        In these Terms and Conditions the words "we", "our" and "us" refer to Active
                                        Mindz (P)
                                    </li>
                                    <li>
                                        Ltd and "the site" refers to the web site that is found at allschooluniforms.com
                                    </li>
                                    <li>
                                        We reserve the right to change any part of this agreement without notice and we
                                        advise users to regularly check the Terms and Conditions of this agreement.
                                    </li>
                                    <li>
                                        You agree to be fully responsible for any claim, expense, liability, losses or
                                        costs including legal fees incurred by us arising from any infringement of the
                                        terms and conditions set out in this agreement.
                                    </li>
                                    <li>
                                        Any disclaimers and exclusions of liability in these terms & conditions shall
                                        not apply to any damages arising from death or personal injury caused by the
                                        negligence of Active Mindz or any of its employees.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <strong> USING THE SITE</strong>
                                <p>When you use ALLSCHOOLUNIFORMS.COM you are committing that :</p>
                                <ul>
                                    <li>Any details you provide to us are current, accurate and complete.</li>
                                    <li>You agree to us using Email as a means of communicating with you.</li>
                                    <li>
                                        You agree that you shall not use the site for illegal purposes, and will respect
                                        all applicable laws and regulations.
                                    </li>
                                    <li>
                                        You agree to be fully responsible for any claim, expense, liability, losses or
                                        costs including legal fees incurred by us arising from any infringement of the
                                        terms and conditions set out in this agreement.
                                    </li>
                                    <li>
                                        We will Email you as soon as possible after you place an order to acknowledge
                                        the receipt of that order and you must check all the details on this
                                        acknowledgement email are correct and contact us as soon as possible if any you
                                        disagree with any information in the email.
                                    </li>
                                    <li>
                                        All orders placed on ALLSCHOOLUNIFORM.COM are subject to acceptance by us and no
                                        contract for the sale of any product will exist until we have accepted the
                                        order.
                                    </li>
                                    <li>
                                        Our acceptance of your order will take place when we have advised you by Email
                                        that we have dispatched your order. Only those items detailed in this e-mail
                                        will be included in the contract formed. In processing your payment and
                                        acknowledging your order we are not legally accepting your order.
                                    </li>
                                    <li>
                                        If your order has not been accepted, you will receive an explanatory email
                                        detailing the reasons why.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <strong>THE WEBSITE</strong>
                                <p>
                                    We take care in the preparation of the content of this website to ensure that all
                                    items for sale are described and priced fully and accurately. However the following
                                    points should be noted :
                                </p>
                                <ul>
                                    <li>
                                        Should there be any errors, howsoever caused, in the pricing and/or description
                                        of items being ordered at the time of the order we are not obliged to supply the
                                        incorrect goods or goods at the incorrect price and it may mean that the order
                                        is not accepted.
                                    </li>
                                    <li>
                                        All items are displayed inclusive of VAT regardless of whether this is 0% or
                                        full rate.
                                    </li>
                                    <li>
                                        Active Mindz shall not be liable to any person for any loss or damage which may
                                        arise from the use of any of the information contained in any of the materials
                                        on this website.
                                    </li>
                                    <li>
                                        Active Mindz.retain the right to modify, add or remove any part of this site
                                        without warning and will not be liable for any consequences arising from such
                                        action.
                                    </li>
                                    <li>
                                        We try to accurately display the colours of all our products. However, as the
                                        actual colour reproduction you view will depend on your particular model of
                                        display screen, its settings and its condition, we cannot absolutely guarantee
                                        that it will accurately display the colour of any individual product.
                                    </li>
                                    <li>
                                        We cannot guarantee totally uninterrupted availability of the site nor do we
                                        guarantee that the functionality of the site will be 100% free of errors.
                                    </li>
                                    <li>
                                        The views expressed in any user generated content are the opinions of those
                                        users and may or may not be the views of Active Mindz Pvt. Ltd.
                                    </li>
                                    <li>
                                        ALLSCHOOLUNIFORM.COM may contain hyperlinks to other websites operated by third
                                        parties. We do not control these websites and will not be liable in respect of
                                        the use of these websites.
                                    </li>
                                    <li>
                                        The content on ALLSCHOOLUNIFORM.COM is displayed for the purposes of promoting
                                        our range of products in the India. Anyone choosing to use this site from
                                        outside the India is responsible for compliance with any local laws that may
                                        apply.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <strong>DELIVERY AND TITLE</strong>
                                <ul>
                                    <li>
                                        ALLSCHOOLUNIFORM.COM offers a standard delivery service. This delivery service
                                        is provided by a third party which may change from time to time as we seek the
                                        best value and quality of service.
                                    </li>
                                    <li>
                                        We will deliver goods ordered by you as soon as possible to the address you give
                                        us for delivery. Usually within 2-5 days.
                                    </li>
                                    <li>
                                        Every effort will be made to deliver goods on time but no responsibility can be
                                        accepted for late or non delivery.
                                    </li>
                                    <li>Goods will be dispatched to the address details that you give us.</li>
                                    <li>
                                        If your order is for multiple items and one or more of the items are out of
                                        stock or delayed then we reserve the right to dispatch goods to you on more than
                                        one shipment at no additional cost to you.
                                    </li>
                                    <li>
                                        Upon delivery to you the goods shall be at your risk. Regardless of delivery
                                        having been made the title in the goods will not pass to you until such time as
                                        payment is made in full for those goods.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <strong>PAYMENT</strong>
                                <ul>
                                    <li>
                                        When you buy on the site you are committing that you are authorised to use the
                                        credit card or other means of payment with which you are paying and that you
                                        have the means to make payment.
                                    </li>
                                    <li>All card payments are processed securely.</li>
                                    <li>
                                        All card transactions are subject to authorisation by the card issuer. In the
                                        event that the issuer refuses to authorise payment we may cancel the order and
                                        will not be liable for any non-delivery or delay in delivery.
                                    </li>
                                    <li>
                                        You have the option to pay by cheque in which case you must provide order
                                        details with your cheque and we reserve the right to hold the processing of your
                                        order until payment has cleared.
                                    </li>
                                    <li>
                                        We reserve the right to terminate this agreement and to refuse any orders from
                                        you if you fail to pay us when payment is due.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <strong>AVAILABILITY AND DELAYS</strong>
                                <ul>
                                    <li>
                                        Through holding stock and supply chain arrangements we endeavour to meet all
                                        orders within our stated target delivery timescale. From time to time it is
                                        possible that there is insufficient stock to supply the goods ordered. In this
                                        circumstance we will contact you and may, at our discretion, supply an
                                        alternative of the same or higher quality.
                                    </li>
                                    <li>
                                        You are under no obligation to accept our alternative and can cancel your order.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <strong>CANCELLATIONS, AMENDMENTS, RETURNS & EXCHANGES</strong>
                                <br />
                                <p>
                                    The ALLSCHOOLUNIFORM.COM website gives you the option to amend or cancel your
                                    order(s) right up until the point that you enter payment and confirm your order. If
                                    you need to amend or cancel an order after that point you must contact us
                                    immediately. Once payment has been taken then no amendments can be made on the
                                    website.
                                </p>
                                <strong>Cancellation</strong>
                                <ul>
                                    <li>
                                        The distance selling regulations provide you with the legal right to cancel your
                                        order with us for any reason and return the goods within seven working days of
                                        receipt of the goods. The first of these seven days is the day after the date of
                                        receipt of the goods. Once payment is taken, no changes to the order or any
                                        cancellation may be made, except in accordance with your legal rights and if one
                                        or more of the following applies : If there is a fault with the garment If the
                                        garment supplied differs in specification to that advertised If you have ordered
                                        a garment of the wrong size and you wish to exchange it for the correct size
                                        then you should contact us to make arrangements.
                                    </li>
                                    <li>
                                        If you wish to cancel an order after payment has been taken then you should
                                        advise us as soon as possible. We will process any cancellation when we receive
                                        your formal notification that you wish to cancel an order. Provided that the
                                        goods are received back by us within the allowed time period, in the same
                                        condition that they were when we sent them to you, unwashed and in the original
                                        packaging then we will re-credit any sum that we have debited from your credit
                                        card for the goods in question or send you a cheque should you have paid by this
                                        means.
                                    </li>
                                    <li>
                                        We will also refund your original delivery charge when a product is faulty,
                                        damaged or has been incorrectly described by us. In other circumstances we will
                                        deduct from any refund our standard P&F; charge or the actual carriage costs we
                                        incurred (whichever is the higher).
                                    </li>
                                </ul>
                                <strong>Returns, Refunds and Exchanges</strong>
                                <br />
                                <ul>
                                    <li>
                                        To qualify all goods must be unused, unwashed, unaltered, in the same condition
                                        in which they were originally supplied and in their original undamaged packaging
                                        and accompanied by the paperwork that clearly identifies the order from which
                                        the return arises.
                                    </li>
                                    <li>
                                        You are responsible for the cost of returning the items and you do so at your
                                        risk. Please note that where no or insufficient postage stamp is attached to a
                                        returned package then it will not reach us and Royal Mail will return it to you.
                                    </li>
                                    <li>
                                        On receipt all items will be inspected and if the product returned is not in a
                                        fully resaleable condition or the packaging is damaged, we reserve the right to
                                        refuse a refund on the item. This does not affect your statutory rights.
                                    </li>
                                    <li>
                                        When we accept a return we will re-credit your credit card with the sum
                                        originally debited for the goods in question or send you a cheque should you
                                        have paid by this method. We will also refund your original delivery charge when
                                        a product is faulty, damaged or has been incorrectly described by us. In other
                                        circumstances we will deduct from any refund our standard P&F; charge or the
                                        actual carriage costs we incurred (whichever is the higher).
                                    </li>
                                    <li>
                                        If you return an item because it is faulty or because it differs to the
                                        advertised specification we will replace the item with a new garment made to
                                        meet the advertised specification.
                                    </li>
                                    <li>These provisions do not affect your statutory rights.</li>
                                </ul>
                            </li>
                            <li>
                                <strong>OWNERSHIP OF RIGHTS</strong>
                                <ul>
                                    <li>Copyright and all other rights in this website are owned by Active Mindz.</li>
                                    <li>
                                        By using the Website you agree to respect those rights and will refrain from
                                        copying, downloading, transmitting, reproducing, printing, or exploiting for
                                        commercial purpose any material contained within the website.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <strong>FORCE MAJEURE</strong>
                                <p>
                                    Active Mindz shall have no liability for any failure to deliver, costs incurred or
                                    for damage to goods supplied caused by any event outside our reasonable control.
                                </p>
                            </li>
                            <li>
                                <strong>TERMINATION</strong>
                                <p>
                                    We reserve the right to terminate our agreement with you and to refuse any orders if
                                    you are in breach of any of our terms and conditions, you fail to pay when payment
                                    is due or we suspect you are or have been involved in any illegal activity on our
                                    site.
                                </p>
                            </li>
                            <li>
                                <strong>SEVERANCE</strong>
                                <p>
                                    If any part of this Agreement is invalid or unenforceable the remaining conditions
                                    shall remain in force.
                                </p>
                            </li>
                            <li>
                                <strong>GOVERNING LAW AND JURISDICTION</strong>
                                <p>
                                    The ALLSCHOOLUNIFORM.COM website and its content and any contract arising from the
                                    use of the site are governed by the laws of the India. Users of the site agree to be
                                    bound exclusively by the jurisdiction of the courts of the Delhi,India. These terms
                                    and conditions do not affect your statutory legal rights.
                                </p>
                            </li>
                        </ol>
                    </div>
                    <div id="size-guides">
                        <h3>Size Guides</h3>
                        <strong>For Size Help</strong>
                        <br />
                        <strong>
                            <p>
                                Below we have outlined general guidelines to ensure proper fit of the products you
                                purchase from us. Here are some useful tips
                            </p>
                        </strong>
                        <p>
                            For best fit, keep the tape measure straight but not tight, and measure over undergarments.
                            Same size items from different manufacturers and product lines may vary.
                        </p>

                        <p>
                            If an individual falls between sizes, order the larger size. An individual should wear the
                            same shoes they intend to use with new garments
                        </p>
                        <img width={'100%'} src="/uploads/extras/size-help-allschooluniform.jpg"></img>

                        <table className="size-guide-help">
                            <tbody>
                                <tr>
                                    <th>Where to Measure Girl</th>
                                    <th>Where to Measure Boy</th>
                                </tr>
                                <tr>
                                    <td>
                                        <b>1. Bust:</b> Measure around shoulder blades, under arms, to the fullest part
                                        of the bust. Note that "Bust" does not mean bra size.
                                    </td>
                                    <td>
                                        <b>1. Neck:</b> Measure around the middle of the neck. Tape should be snug but
                                        not tight.
                                        <br />
                                        <br />
                                        <b>2. Chest:</b> Measure around the fullest part, around shoulder blades. Tape
                                        should be snug but not tight.
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>2. Waist:</b> Stand in a relaxed position and measure around the narrowest
                                        part of the natural waist.
                                    </td>
                                    <td>
                                        <b>3. Waist:</b> Stand in a relaxed position and measure around the narrowest
                                        part of the natural waist.
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <b>3. Hips:</b> Measure around the fullest part, normally about seven inches
                                        below natural waistline.
                                    </td>
                                    <td>
                                        <b>4. Sleeve Length:</b> Bend elbow and measure from the center of the back of
                                        the neck, across the shoulder and around the wrist bone.{' '}
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <b>Inseam:</b> Stand with legs straight and slightly apart with feet flat. Hold
                                        one end of the measuring tape to the base of the crotch. Straighten the tape
                                        down the inside of the leg to the top of the shoe.
                                    </td>
                                    <td>
                                        <b>Inseam:</b> Stand with legs straight and slightly apart with feet flat. Hold
                                        one end of the measuring tape to the base of the crotch. Straighten the tape
                                        down the inside of the leg to the top of the shoe. Out seam is from the belt to
                                        top of the shoe measured on the outside of the leg.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="payment-methods">
                        <h3>Payment Methods</h3>
                        <strong>Credit Card / Debit Card</strong>
                        <p>
                            Necessary precautions have been taken to provide you a safe and encrypted environment
                            required to make any purchase from this site online using Credit Card / Debit Card.
                        </p>
                        <strong>COD</strong>
                        <p>You can opt for payment in Cash on Delivery.</p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default Policies;
