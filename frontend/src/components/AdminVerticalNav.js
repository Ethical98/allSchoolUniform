import React from 'react';
import { Nav, Tab, Col, Row } from 'react-bootstrap';

const AdminVerticalNav = ({ children, tabContent, currentKey = '', setKey }) => {
    return (
        <div className="my-3" style={{ marginLeft: '-5vw' }}>
            <Tab.Container activeKey={currentKey} onSelect={k => setKey(k)}>
                <Row>
                    <Col sm={3}>
                        <Nav variant="pills" className="flex-column">
                            {children}
                        </Nav>
                    </Col>
                    <Col sm={9}>{tabContent}</Col>
                </Row>
            </Tab.Container>
        </div>
    );
};

export default AdminVerticalNav;
