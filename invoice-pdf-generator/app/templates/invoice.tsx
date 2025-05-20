import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";
import { type InvoiceSettings } from "app/types";

const createStyles = (props: InvoicePdfProps) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 40,
    },
    businessInfo: {
      textAlign: "right",
    },
    businessName: {
      fontSize: 20,
      fontWeight: "bold",
      color: props.primaryColor || "#3b82f6",
      marginBottom: 4,
    },
    invoiceTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 15,
      color: props.primaryColor || "#3b82f6",
    },
    infoSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    infoColumn: {
      width: "48%",
    },
    infoBox: {
      padding: 12,
      backgroundColor: "#f9fafb",
      borderRadius: 4,
      marginBottom: 10,
    },
    label: {
      fontSize: 10,
      color: "#6b7280",
      marginBottom: 3,
    },
    value: {
      fontSize: 11,
    },
    itemsTable: {
      width: "100%",
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: props.primaryColor || "#3b82f6",
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      padding: 8,
      color: "white",
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      padding: 8,
    },
    tableCol1: {
      width: "40%",
    },
    tableCol2: {
      width: "15%",
      textAlign: "center",
    },
    tableCol3: {
      width: "15%",
      textAlign: "right",
    },
    tableCol4: {
      width: props.showTaxColumn ? "15%" : "0%",
      textAlign: "right",
    },
    tableCol5: {
      width: props.showTaxColumn ? "15%" : "30%",
      textAlign: "right",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      padding: 8,
    },
    totalLabel: {
      width: "25%",
      textAlign: "right",
      marginRight: 8,
    },
    totalValue: {
      width: "15%",
      textAlign: "right",
      fontWeight: "bold",
    },
    grandTotal: {
      fontSize: 14,
      fontWeight: "bold",
      color: props.primaryColor || "#3b82f6",
    },
    footer: {
      marginTop: 40,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 20,
    },
    termsAndConditions: {
      marginBottom: 20,
    },
    footerText: {
      textAlign: "center",
      fontSize: 10,
      color: "#6b7280",
      marginTop: 15,
    },
    pageNumber: {
      position: "absolute",
      bottom: 30,
      right: 40,
      fontSize: 9,
      color: "#9ca3af",
    },
  });

// Define interface for invoice items
interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  tax?: number;
}

type InvoicePdfProps = InvoiceSettings & {
  // Customer information
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;

  // Items and totals
  items?: InvoiceItem[];
  subtotal?: string | number;
  taxTotal?: string | number;

  // Payment information
  paymentMethod?: string;
  paymentDetails?: string;

  primaryColor?: string;

  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
};

export const InvoicePdf = (props: InvoicePdfProps) => {
  const {
    businessName = "Your Company Name",
    address = "123 Business St\nCity, State 12345",
    phone = "+1 (555) 123-4567",
    email = "contact@yourcompany.com",
    invoicePrefix = "INV-",
    invoiceNumber = "00001",
    invoiceDate = new Date().toLocaleDateString(),
    currency = "USD",
    showTaxColumn = true,

    customerName = "Customer Name",
    customerAddress = "Customer Address\nCustomer City, State 12345",
    customerEmail = "customer@example.com",

    items = [{ description: "Sample Product", quantity: 1, price: 100 }],

    paymentMethod = "Bank Transfer",
    paymentDetails = "Account: 1234567890\nRouting: 987654321",

    termsAndConditions = "Standard terms and conditions apply.",
    footerText = "Thank you for your business!",
    subtotal = "100.00",
    taxTotal = "10.00",
  } = props;

  const styles = createStyles(props);

  const total = Number(subtotal) + Number(taxTotal);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and business info */}
        <View style={styles.headerContainer}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{businessName}</Text>
            <Text>{address}</Text>
            <Text>{phone}</Text>
            <Text>{email}</Text>
          </View>
        </View>

        {/* Invoice title and number */}
        <View>
          <Text style={styles.invoiceTitle}>
            INVOICE {invoicePrefix}
            {invoiceNumber}
          </Text>
        </View>

        {/* Invoice and customer info */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <View style={styles.infoBox}>
              <Text style={styles.label}>BILL TO</Text>
              <Text style={styles.value}>{customerName}</Text>
              <Text style={styles.value}>{customerAddress}</Text>
              <Text style={styles.value}>{customerEmail}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoBox}>
              <Text style={styles.label}>INVOICE DETAILS</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.label}>Invoice Date:</Text>
                <Text style={styles.value}>{invoiceDate}</Text>
              </View>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>PAYMENT METHOD</Text>
              <Text style={styles.value}>{paymentMethod}</Text>
              <Text style={styles.value}>{paymentDetails}</Text>
            </View>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Description</Text>
            <Text style={styles.tableCol2}>Qty</Text>
            <Text style={styles.tableCol3}>Price</Text>
            {showTaxColumn && <Text style={styles.tableCol4}>Tax</Text>}
            <Text style={styles.tableCol5}>Amount</Text>
          </View>

          {items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                i % 2 !== 0 ? { backgroundColor: "#f9fafb" } : {},
              ]}
            >
              <Text style={styles.tableCol1}>{item.description}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{formatCurrency(item.price)}</Text>
              {showTaxColumn && (
                <Text style={styles.tableCol4}>
                  {formatCurrency(item.tax || 0)}
                </Text>
              )}
              <Text style={styles.tableCol5}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(Number(subtotal))}
            </Text>
          </View>

          {showTaxColumn && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(Number(taxTotal))}
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, { marginTop: 5 }]}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {/* Footer with terms */}
        <View style={styles.footer}>
          {termsAndConditions && (
            <View style={styles.termsAndConditions}>
              <Text style={styles.label}>TERMS & CONDITIONS</Text>
              <Text>{termsAndConditions}</Text>
            </View>
          )}

          <Text style={styles.footerText}>{footerText}</Text>
        </View>

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
