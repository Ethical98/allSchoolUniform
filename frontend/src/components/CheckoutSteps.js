import React, { useEffect, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './css/CheckoutSteps.css';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (step1 && step2 && step2 && step4) {
            setValue(100);
        } else if (step1 && step2 && step3) {
            setValue(65);
        } else if (step1 && step2) {
            setValue(35);
        } else {
            setValue(20);
        }
    }, [step1, step2, step3, step4]);

    return (
        <>
            <div className="checkout-steps">
                <ProgressBar animated now={value} />
                <ul className="d-flex align-items-center justify-content-between">
                    {step1 ? (
                        <Link to="/login">
                            <li id="step1" className="active">
                                <i className="fas fa-user step1-icon"></i>
                            </li>
                        </Link>
                    ) : (
                        <li id="step1">
                            <i className="fas fa-user step1-icon"></i>
                        </li>
                    )}
                    {step2 ? (
                        <Link to="/shipping">
                            <li id="step2" className="active">
                                <i className="fas fa-truck step2-icon"></i>
                            </li>
                        </Link>
                    ) : (
                        <li id="step2">
                            <i className="fas fa-truck step2-icon"></i>
                        </li>
                    )}
                    {step3 ? (
                        <Link to="/payment">
                            <li id="step3" className="active">
                                <i className="fas fa-rupee-sign step3-icon"></i>
                            </li>
                        </Link>
                    ) : (
                        <li id="step3">
                            <i className="fas fa-rupee-sign step3-icon"></i>
                        </li>
                    )}
                    {step4 ? (
                        <Link to="/placeorder">
                            <li id="step4" className="active">
                                <i className="fas fa-receipt step4-icon"></i>
                            </li>
                        </Link>
                    ) : (
                        <li id="step4">
                            <i className="fas fa-receipt step4-icon"></i>
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
};

export default CheckoutSteps;
