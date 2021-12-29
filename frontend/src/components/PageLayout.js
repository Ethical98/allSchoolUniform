import React from 'react';
import { Container } from 'react-bootstrap';
import Footer from './Footer';
import Header from './Header';

const PageLayout = ({ children }) => {
  return (
    <>
      <Header />
      <main>
        <Container>{children}</Container>
      </main>
      <Footer />
    </>
  );
};

export default PageLayout;
