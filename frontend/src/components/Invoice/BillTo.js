import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  billTo: {
    paddingBottom: 3,
    fontFamily: 'Helvetica-Oblique',
  },
});

const BillTo = ({ shippingAddress, name, email, isAdmin }) => (
  <View>
    <Text style={styles.billTo}>{isAdmin ? 'Buyer' : 'Bill To:'}</Text>
    <Text>{name}</Text>
    <Text>{shippingAddress.address}</Text>
    <Text>{shippingAddress.city}</Text>
    <Text>{shippingAddress.postalCode}</Text>
    <Text>{shippingAddress.country}</Text>
    <Text>{email}</Text>
  </View>
);

export default BillTo;
