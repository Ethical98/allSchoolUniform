import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    borderBottom: '2px solid black',
    margin: '10px 0',
  },
});

const InvoiceTitle = ({ title, orderId }) => (
  <View style={styles.titleContainer}>
    <Text>{title}</Text>
    <Text>Order #{orderId}</Text>
  </View>
);

export default InvoiceTitle;
