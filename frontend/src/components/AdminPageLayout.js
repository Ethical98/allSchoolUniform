import React from 'react';
import { Container } from 'react-bootstrap';
import AdminHeader from './AdminHeader';

const AdminPageLayout = ({ children }) => {
  return (
    <>
      <AdminHeader />
      <Container>{children}</Container>
    </>
  );
};

export default AdminPageLayout;
