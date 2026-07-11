import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import AdminSidebar from './AdminSidebar';
import Footer from './Footer';
import Header from './Header';

const AdminPageLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <Header />
            {/* Mobile hamburger bar — visible only on <768px */}
            <div className="admin-mobile-toggle-bar d-md-none">
                <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setMobileOpen(true)}
                >
                    <i className="fas fa-bars" /> Menu
                </Button>
            </div>
            <div className="admin-layout-body">
                <AdminSidebar
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed((c) => !c)}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />
                <div className="admin-layout-content">
                    <main className="p-3">{children}</main>
                    <Footer />
                </div>
            </div>
        </>
    );
};

export default AdminPageLayout;
