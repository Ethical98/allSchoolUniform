import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const borderColor = 'black';
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomColor: '#bff0fd',
    backgroundColor: '#bff0fd',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    textAlign: 'center',
    fontStyle: 'bold',
    flexGrow: 1,
  },
  sno: {
    width: '36px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
  },
  description: {
    width: '150px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
  },
  size: {
    width: '43px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
  },
  qty: {
    width: '41px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
  },
  price: { width: '50px', borderRightColor: borderColor, borderRightWidth: 1 },
  disc: { width: '45px', borderRightColor: borderColor, borderRightWidth: 1 },

  netPrice: {
    width: '55px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
  },
  total: {
    width: '55px',
  },
});

const InvoiceTableHeader = () => (
  <View style={styles.container}>
    <Text style={styles.sno}>S.No.</Text>
    <Text style={styles.description}>Product</Text>
    <Text style={styles.size}>Size</Text>
    <Text style={styles.qty}>Qty</Text>
    <Text style={styles.price}>Price</Text>
    <Text style={styles.disc}>Disc.</Text>
    <Text style={styles.netPrice}>Net Price</Text>
    <Text style={styles.total}>Total</Text>
  </View>
);

export default InvoiceTableHeader;
