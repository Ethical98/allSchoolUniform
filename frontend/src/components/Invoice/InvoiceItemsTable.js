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
        marginTop: '20px',
        fontWeight: 900,
        marginBottom: 0,
        fontSize: 25
    }
});

const InvoiceItemsTable = ({ items, dateCreated }) => (
    <>
        <View style={styles.tableHeading}>
            <Text>ORDER SUMMARY</Text>
        </View>
        <View style={styles.tableContainer}>
            <InvoiceTableHeader />
            <InvoiceTableRow items={items ? items : []} />
            <InvoiceTableBlankSpace rowsCount={items ? tableRowsCount - items.length : tableRowsCount} />
            <InvoiceTableFooter items={items ? items : []} dateCreated={dateCreated} />
        </View>
    </>
);

export default InvoiceItemsTable;
