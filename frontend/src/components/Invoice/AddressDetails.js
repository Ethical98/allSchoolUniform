import BillTo from './BillTo';
import CorpOff from './CorpOff';
import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    AddressContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: '10px',
        borderBottom: '1px solid grey'
    }
});

const AddressDetails = ({ order, name, email, phone, isAdmin }) => {
    return (
        <>
            {isAdmin ? (
                <View style={styles.AddressContainer}>
                    <CorpOff isAdmin={isAdmin} />
                    <BillTo
                        shippingAddress={order.shippingAddress ? order.shippingAddress : {}}
                        name={name ? name : ''}
                        email={email}
                        phone={phone}
                        isAdmin
                    />
                </View>
            ) : (
                <View style={styles.AddressContainer}>
                    <BillTo
                        shippingAddress={order.shippingAddress ? order.shippingAddress : {}}
                        name={name ? name : ''}
                        email={email}
                        phone={phone}
                        isAdmin={isAdmin}
                    />
                    <CorpOff isAdmin={false} />
                </View>
            )}
        </>
    );
};

export default AddressDetails;
