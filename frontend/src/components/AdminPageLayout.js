import React from 'react';
import { Container } from 'react-bootstrap';
import AdminHeader from './AdminHeader';
import Footer from './Footer';
import Header from './Header';

const AdminPageLayout = ({ children }) => {
    return (
        <>
            <Header />
            <AdminHeader />
            <main>
                <Container>{children}</Container>
            </main>
            <Footer />
        </>
    );
};

export default AdminPageLayout;
