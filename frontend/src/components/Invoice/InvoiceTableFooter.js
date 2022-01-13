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
    fontStyle: 'bold',
  },
  description: {
    width: '85%',
    textAlign: 'right',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    paddingRight: 8,
  },
  total: {
    width: '15%',
    textAlign: 'right',
    paddingRight: 8,
  },

  orderDate: {
    width: '50%%',
    textAlign: 'left',
    borderRightColor: borderColor,
    borderRightWidth: 1,
    padding: '2 0 0 8',
    borderTopColor: borderColor,
    borderTopWidth: 1,
  },
  deliveryDate: {
    width: '50%%',
    textAlign: 'left',
    padding: '2 0 0 8',
    borderTopColor: borderColor,
    borderTopWidth: 1,
  },
  termsAndCond: {
    width: '100%',
    fontSize: 9,
    borderBottomColor: borderColor,
    borderBottomWidth: 1,
  },
  salesAddress: {
    fontSize: 9,
  },
  gst: {
    width: '100%%',
    textAlign: 'left',
    padding: '2 0 0 8',
    borderBottomColor: borderColor,
    borderBottomWidth: 1,
  },
  delivery: {
    width: '100%%',
    textAlign: 'left',
    padding: '2 0 0 8',
  },
});

const InvoiceTableFooter = ({ items, dateCreated }) => {
  const total = items
    .map((item) => item.qty * item.price)
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  return (
    <>
      <View style={styles.row}>
        <Text style={styles.description}>I.Total</Text>
        <Text style={styles.total}>{Number.parseFloat(total).toFixed(2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.description}>Less Payment</Text>
        <Text style={styles.total}>0</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.description}>TOTAL</Text>
        <Text style={styles.total}>{Number.parseFloat(total).toFixed(2)}</Text>
      </View>

      <Text style={styles.gst}>
        Inclusive of IGST 60 on ₹{Number.parseFloat(total).toFixed(2)}
      </Text>

      <Text style={styles.delivery}>Delivered BY Self</Text>

      <View style={styles.row}>
        <Text style={styles.orderDate}>Date of Order:{dateCreated}</Text>
        <Text style={styles.deliveryDate}>Delivered On:</Text>
      </View>
      <Text style={styles.termsAndCond}>
        Terms & Cond. As on website : www.allschooluniform.com Ccare
        011-45091585-00 , help@allschooluniform.com
      </Text>
      <Text style={styles.salesAddress}>
        Sales Office : 1411, Nicholson Road Kashmere Gate, Delhi - 110006.
        GSTNo. 07ABKFA2941B1ZU
      </Text>
    </>
  );
};

export default InvoiceTableFooter;