import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  invoiceHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2px solid black',
  },
  invoiceDate: {
    marginRight: '15%',
  },
});

const InvoiceNo = ({ order }) => {
  const items = order.modified ? order.modifiedItems : order.orderItems;
  const total = items
    .map((item) => item.qty * item.price)
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  return (
    <View style={styles.invoiceHeaderContainer}>
      <View>
        <Text>Payment Method: {order.paymentMethod}</Text>
        <Text>Total Amount:{total}</Text>
      </View>
      <View style={styles.invoiceDate}>
        <Text>Order Date:</Text>
        <Text>{order.createdAt && order.createdAt.substring(0, 10)}</Text>
      </View>
    </View>
  );
};

export default InvoiceNo;
