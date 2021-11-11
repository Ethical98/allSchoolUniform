import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  corpOff: {
    paddingBottom: 3,
    fontFamily: 'Helvetica-Oblique',
  },
});

const CorpOff = ({ isAdmin }) => {
  return (
    <View>
      <Text style={styles.corpOff}>{isAdmin ? 'Seller' : 'Corp. Off.'}</Text>
      <Text>Active Mindz</Text>
      <Text>Ananth Road,Udyog Vihar</Text>
      <Text>Phase IV, Sec 18,</Text>
      <Text>Gurugram Haryana</Text>
    </View>
  );
};

export default CorpOff;
