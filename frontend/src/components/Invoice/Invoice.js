import React from 'react';
import { Page, Document, Image, StyleSheet } from '@react-pdf/renderer';
import InvoiceNo from './InvoiceNo';
import InvoiceThankYouMsg from './InvoiceThankYouMsg';
import InvoiceTitle from './InvoiceTitle';
import InvoiceItemsTable from './InvoiceItemsTable';
import AddressDetails from './AddressDetails';

const styles = StyleSheet.create({
    page: {
        display: 'flex',
        fontFamily: 'Helvetica',
        fontSize: 11,
        paddingTop: 20,
        paddingLeft: 60,
        paddingRight: 60,
        lineHeight: 1.5,
        flexDirection: 'column'
    },
    logo: {
        width: 120,
        height: 66
    }
});

const Invoice = ({ order, name, email, phone, isAdmin = false, billType, invoiceNumber, shippingPrice }) => {
    return (
        <Document>
            {order && (
                <Page size="A4" orientation="potrait" style={styles.page}>
                    <Image style={styles.logo} src="/uploads/asu-top-logo.png" />
                    <InvoiceTitle orderId={order.orderId} invoiceNumber={invoiceNumber} />
                    <AddressDetails order={order} name={name} email={email} phone={phone} isAdmin={false} />
                    <InvoiceNo order={order} />
                    <InvoiceItemsTable
                        items={order.modified ? order.modifiedItems : order.orderItems}
                        dateCreated={order.createdAt && order.createdAt.substring(0, 10)}
                        billType={billType}
                        shippingPrice={shippingPrice}
                    />
                    <InvoiceThankYouMsg />
                </Page>
            )}
            {order && isAdmin && (
                <Page size="A4" orientation="potrait" style={styles.page}>
                    <Image style={styles.logo} src="/uploads/asu-top-logo.png" />
                    <InvoiceTitle orderId={order.orderId} invoiceNumber={invoiceNumber} />
                    <AddressDetails order={order} name={name} email={email} phone={phone} isAdmin />
                    <InvoiceNo order={order} />
                    <InvoiceItemsTable
                        items={order.modified ? order.modifiedItems : order.orderItems}
                        dateCreated={order.createdAt && order.createdAt.substring(0, 10)}
                        billType={billType}
                        shippingPrice={shippingPrice}
                    />
                    <InvoiceThankYouMsg />
                </Page>
            )}
        </Document>
    );
};

export default Invoice;
