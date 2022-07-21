import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const borderColor = 'black';
const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        borderBottomColor: borderColor,
        borderBottomWidth: 1,
        alignItems: 'center',
        height: 24,
        fontSize: 12,
        fontStyle: 'bold'
    },
    description: {
        width: '85%',
        textAlign: 'right',
        borderRightColor: borderColor,
        borderRightWidth: 1,
        paddingRight: 8
    },
    total: {
        width: '15%',
        textAlign: 'right',
        paddingRight: 8
    },

    orderDate: {
        width: '50%%',
        textAlign: 'left',
        borderRightColor: borderColor,
        borderRightWidth: 1,
        padding: '2 0 0 8',
        borderTopColor: borderColor,
        borderTopWidth: 1
    },
    deliveryDate: {
        width: '50%%',
        textAlign: 'left',
        padding: '2 0 0 8',
        borderTopColor: borderColor,
        borderTopWidth: 1
    },
    termsAndCond: {
        width: '100%',
        fontSize: 9,
        borderBottomColor: borderColor,
        borderBottomWidth: 1
    },
    salesAddress: {
        fontSize: 9
    },
    gst: {
        width: '100%%',
        textAlign: 'left',
        padding: '2 0 0 8',
        borderBottomColor: borderColor,
        borderBottomWidth: 1
    },
    delivery: {
        width: '100%%',
        textAlign: 'left',
        padding: '2 0 0 8'
    }
});

const InvoiceTableFooter = ({ items, dateCreated, billType, shippingPrice }) => {
    const total = items
        .map((item) => item.qty * (item.price - (item.disc / 100) * item.price))
        .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return (
        <>
            <View style={styles.row}>
                <Text style={styles.description}>I.Total</Text>
                <Text style={styles.total}>{Number.parseFloat(total).toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.description}>Shipping</Text>
                <Text style={styles.total}>{shippingPrice}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.description}>TOTAL</Text>
                <Text style={styles.total}>{Number.parseFloat(total + shippingPrice).toFixed(2)}</Text>
            </View>

            {billType === 'IGST' && (
                <Text style={styles.gst}>
                    Inclusive of {billType} Rs {Number.parseFloat((5 / 100) * total).toFixed(2)} on Rs{' '}
                    {Number.parseFloat(total / 1.05).toFixed(2)}
                </Text>
            )}

            {billType === 'CGST' && (
                <Text style={styles.gst}>
                    Inclusive of {billType} Rs {Number.parseFloat((2.5 / 100) * total).toFixed(2)} and SGST Rs
                    {Number.parseFloat((2.5 / 100) * total).toFixed(2)} On Rs{' '}
                    {Number.parseFloat(total / 1.05).toFixed(2)}
                </Text>
            )}

            <Text style={styles.delivery}>Delivered BY Self</Text>

            <View style={styles.row}>
                <Text style={styles.orderDate}>Date of Order:{dateCreated}</Text>
                <Text style={styles.deliveryDate}>Dispatched </Text>
            </View>
            <Text style={styles.termsAndCond}>
                Terms & Cond. As on website : www.allschooluniform.com Ccare 011-45091585-00 , help@allschooluniform.com
            </Text>
            <Text style={styles.salesAddress}>
                Sales Office : 1411, Nicholson Road Kashmere Gate, Delhi - 110006. GSTNo. 07ABKFA2941B1ZU
            </Text>
        </>
    );
};

export default InvoiceTableFooter;
