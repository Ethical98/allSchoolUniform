import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { Nav, OverlayTrigger, Tooltip, Offcanvas } from 'react-bootstrap';
import './css/AdminSidebar.css';

const NAV_CONFIG = [
    { label: 'Dashboard', icon: 'fas fa-chart-bar', path: '/admin/dashboard' },
    { label: 'Users', icon: 'fas fa-users', path: '/admin/userlist' },
    { label: 'Products', icon: 'fas fa-tshirt', path: '/admin/productlist' },
    { label: 'Orders', icon: 'fas fa-box-open', path: '/admin/orderlist' },
    {
        label: 'Stock',
        icon: 'fas fa-warehouse',
        basePath: '/admin/stock',
        children: [
            { label: 'Stock Dashboard', path: '/admin/stock' },
            { label: 'Overview', path: '/admin/stock/overview' },
            { label: 'Adjustments', path: '/admin/stock/adjust' },
            { label: 'Valuation', path: '/admin/stock/valuation' },
            { label: 'Movement Log', path: '/admin/stock/movements' }
        ]
    },
    {
        label: 'Billing',
        icon: 'fas fa-file-invoice',
        basePath: '/admin/billing',
        children: [
            { label: 'Quotations', path: '/admin/billing' },
            { label: 'New Quotation', path: '/admin/billing/quotation/create' },
            { label: 'Cash Bill', path: '/admin/billing/cash-bill' },
            { label: 'Companies', path: '/admin/billing/companies' },
            { label: 'Templates', path: '/admin/billing/templates' },
            { label: 'Reports', path: '/admin/billing/reports' },
            { label: 'Settings', path: '/admin/billing/settings' }
        ]
    },
    {
        label: 'Returns',
        icon: 'fas fa-undo-alt',
        basePath: '/admin/returns',
        children: [
            { label: 'All Returns', path: '/admin/returns' },
        ]
    },
    {
        label: 'Shipping',
        icon: 'fas fa-shipping-fast',
        basePath: '/admin/shipping',
        children: [
            { label: 'Dashboard', path: '/admin/shipping' },
            { label: 'NDR Management', path: '/admin/shipping/ndr' },
        ]
    },
    { label: 'Schools', icon: 'fas fa-graduation-cap', path: '/admin/schoollist' },
    { label: 'Product Type', icon: 'fas fa-th', path: '/admin/typelist' },
    { label: 'Homepage', icon: 'fas fa-home', path: '/admin/homepage' }
];

const AdminSidebar = ({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const [expandedGroups, setExpandedGroups] = useState({});

    // Auto-expand group matching current route
    useEffect(() => {
        NAV_CONFIG.forEach((item) => {
            if (item.children && pathname.startsWith(item.basePath)) {
                setExpandedGroups((prev) => ({ ...prev, [item.label]: true }));
            }
        });
    }, [pathname]);

    const isItemActive = (path) => {
        // For paginated routes like /admin/productlist/page/2
        if (path === '/admin/productlist') {
            return pathname.startsWith('/admin/productlist');
        }
        if (path === '/admin/orderlist') {
            return pathname.startsWith('/admin/orderlist') || pathname.startsWith('/admin/order/');
        }
        if (path === '/admin/userlist') {
            return pathname.startsWith('/admin/userlist') || pathname.startsWith('/admin/user/');
        }
        if (path === '/admin/schoollist') {
            return pathname.startsWith('/admin/schoollist') || pathname.startsWith('/admin/school');
        }
        if (path === '/admin/typelist') {
            return pathname.startsWith('/admin/typelist') || pathname.startsWith('/admin/type');
        }
        return pathname === path;
    };

    const isGroupActive = (basePath) => pathname.startsWith(basePath);

    const isSubItemActive = (path, basePath) => {
        if (path === basePath) return pathname === path;
        return pathname.startsWith(path);
    };

    const toggleGroup = (label) => {
        setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const renderNavItem = (item) => {
        const active = isItemActive(item.path);
        const link = (
            <Nav.Item key={item.path}>
                <LinkContainer to={item.path}>
                    <Nav.Link className={active ? 'active' : ''} onClick={mobileOpen ? onMobileClose : undefined}>
                        <i className={item.icon} />
                        <span>{item.label}</span>
                    </Nav.Link>
                </LinkContainer>
            </Nav.Item>
        );

        if (collapsed) {
            return (
                <OverlayTrigger key={item.path} placement="right" overlay={<Tooltip>{item.label}</Tooltip>}>
                    <div>{link}</div>
                </OverlayTrigger>
            );
        }

        return link;
    };

    const renderGroupItem = (item) => {
        const groupActive = isGroupActive(item.basePath);
        const expanded = expandedGroups[item.label] || false;

        const header = (
            <div
                className={`sidebar-group-header ${groupActive ? 'group-active' : ''}`}
                onClick={() => toggleGroup(item.label)}
            >
                <i className={item.icon} />
                <span>{item.label}</span>
                <i className={`fas fa-chevron-right sidebar-group-chevron ${expanded ? 'expanded' : ''}`} />
            </div>
        );

        if (collapsed) {
            return (
                <OverlayTrigger key={item.label} placement="right" overlay={<Tooltip>{item.label}</Tooltip>}>
                    <div>{header}</div>
                </OverlayTrigger>
            );
        }

        return (
            <div key={item.label}>
                {header}
                <div className={`sidebar-group-children ${expanded ? 'expanded' : ''}`}>
                    {item.children.map((child) => {
                        const active = isSubItemActive(child.path, item.basePath);
                        return (
                            <Nav.Item key={child.path}>
                                <LinkContainer to={child.path}>
                                    <Nav.Link
                                        className={active ? 'active' : ''}
                                        onClick={mobileOpen ? onMobileClose : undefined}
                                    >
                                        <span>{child.label}</span>
                                    </Nav.Link>
                                </LinkContainer>
                            </Nav.Item>
                        );
                    })}
                </div>
            </div>
        );
    };

    const sidebarContent = (
        <nav className={`admin-sidebar ${collapsed && !mobileOpen ? 'collapsed' : ''}`}>
            {!mobileOpen && (
                <div className="sidebar-toggle" onClick={onToggleCollapse}>
                    <i className={`fas fa-${collapsed ? 'angles-right' : 'angles-left'}`} />
                </div>
            )}
            <Nav className="flex-column">
                {NAV_CONFIG.map((item) => (item.children ? renderGroupItem(item) : renderNavItem(item)))}
            </Nav>
        </nav>
    );

    return (
        <>
            {/* Desktop/Tablet: inline sidebar */}
            <div className="d-none d-md-block sidebar-wrapper">{sidebarContent}</div>

            {/* Mobile: Offcanvas slide-out */}
            <Offcanvas
                show={mobileOpen}
                onHide={onMobileClose}
                className="d-md-none admin-sidebar-offcanvas"
                style={{ width: '260px' }}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Admin Menu</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">{sidebarContent}</Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default AdminSidebar;
