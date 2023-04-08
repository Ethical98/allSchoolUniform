import React from 'react';

const ErrorScreen = () => {
    return (
        <div className="error-screen loading">
            <div className="content">
                <h2>
                    Unexpected Error <b>:(</b>
                </h2>
                <div class="gears">
                    <div class="gear one">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                    <div class="gear two">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                    <div class="gear three">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                </div>
                <a href="www.allschooluniform.com">Go Back to Home</a>
            </div>
        </div>
    );
};

export default ErrorScreen;
