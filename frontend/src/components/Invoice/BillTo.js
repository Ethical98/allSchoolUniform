import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    billTo: {
        paddingBottom: 3,
        fontFamily: 'Helvetica-Oblique'
    },
    address: {
        wordWrap: 'break-word'
    },
    view: {
        maxWidth: '50%'
    }
});

const BillTo = ({ shippingAddress, name, email, isAdmin, phone }) => (
    <View style={styles.view}>
        <Text style={styles.billTo}>{isAdmin ? 'Buyer' : 'Bill To:'}</Text>
        <Text>{name}</Text>
        <Text style={!isAdmin && styles.address}>{shippingAddress.address}</Text>
        <Text>{shippingAddress.city}</Text>
        <Text>{shippingAddress.postalCode}</Text>
        <Text>{shippingAddress.country}</Text>
        <Text>{email}</Text>
        <Text>{phone}</Text>
    </View>
);

export default BillTo;
