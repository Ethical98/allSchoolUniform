import React, { Fragment } from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const borderColor = 'black';
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    fontStyle: 'bold',
  },
  sno: {
    width: '36px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    paddingLeft: 8,
  },
  description: {
    width: '150px',
    textAlign: 'left',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    paddingLeft: 8,
  },
  size: {
    width: '43px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: 'right',
    paddingRight: 8,
  },

  qty: {
    width: '41px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: 'right',
    paddingRight: 8,
  },
  price: {
    width: '50px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: 'right',
    paddingRight: 8,
  },
  disc: {
    width: '45px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: 'right',
    paddingRight: 8,
  },
  netPrice: {
    width: '55px',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: 'right',
    paddingRight: 8,
  },
  total: {
    width: '55px',
    textAlign: 'right',
    paddingRight: 8,
  },
});

const InvoiceTableRow = ({ items }) => {
  const rows = items.map((item, index) => (
    <View style={styles.row} key={index.toString()}>
      <Text style={styles.sno}>{index + 1}</Text>
      <Text style={styles.description}>{item.name}</Text>
      <Text style={styles.size}>{item.size}</Text>
      <Text style={styles.qty}>{item.qty}</Text>
      <Text style={styles.price}>{item.price}</Text>
      <Text style={styles.disc}>{item.disc ? item.disc : 0}</Text>
      <Text style={styles.netPrice}>{item.price - 0}</Text>
      <Text style={styles.total}>{(item.qty * item.price).toFixed(2)}</Text>
    </View>
  ));
  return <Fragment>{rows}</Fragment>;
};

export default InvoiceTableRow;
