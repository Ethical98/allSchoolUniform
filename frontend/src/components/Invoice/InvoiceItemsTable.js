import React from 'react';
import { View, StyleSheet, Text } from '@react-pdf/renderer';
import InvoiceTableHeader from './InvoiceTableHeader';
import InvoiceTableRow from './InvoiceTableRow';
import InvoiceTableBlankSpace from './InvoiceTableBlankSpace';
import InvoiceTableFooter from './InvoiceTableFooter';

const tableRowsCount = 10;

const styles = StyleSheet.create({
    tableContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: 'black'
    },
    tableHeading: {
        marginTop: '5px',
        fontWeight: 900,
        marginBottom: 0,
        fontSize: 20
    }
});

const InvoiceItemsTable = ({ items, dateCreated, billType, shippingPrice }) => {
    const rowsCount = items ? (items.length > 10 ? 0 : tableRowsCount - items.length) : tableRowsCount;
    return (
        <>
            <View style={styles.tableHeading}>
                <Text>ORDER SUMMARY</Text>
            </View>
            <View style={styles.tableContainer}>
                <InvoiceTableHeader />
                <InvoiceTableRow items={items ? items : []} />
                <InvoiceTableBlankSpace rowsCount={rowsCount} />
                <InvoiceTableFooter
                    items={items ? items : []}
                    dateCreated={dateCreated}
                    billType={billType}
                    shippingPrice={shippingPrice}
                />
            </View>
        </>
    );
};

export default InvoiceItemsTable;
