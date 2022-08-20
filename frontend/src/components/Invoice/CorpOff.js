import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    corpOff: {
        paddingBottom: 3,
        fontFamily: 'Helvetica-Oblique'
    },
    view: {
        maxWidth: '50%'
    }
});

const CorpOff = ({ isAdmin }) => {
    return (
        <View style={styles.view}>
            <Text style={styles.corpOff}>{isAdmin ? 'Seller' : 'Corp. Off.'}</Text>
            <Text>Active Mindz</Text>
            <Text>Ananth Road,Udyog Vihar</Text>
            <Text>Phase IV, Sec 18,</Text>
            <Text>Gurugram Haryana</Text>
        </View>
    );
};

export default CorpOff;
