import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import type { InvoiceSettings } from "app/types";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf } from "app/templates/invoice";
import { mailer } from "app/services/mail";

export const action = async ({ request }: ActionFunctionArgs) => {
  const {
    payload: order,
    topic,
    shop,
    admin,
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  console.log(order);
  try {
    const response = await admin?.graphql(`
        query {
          shop {
            currencyCode
            metafield(namespace: "invoice_customizer", key: "settings") {
              jsonValue
            }
          }
        }
      `);

    const responseJson = await response?.json();
    const metafield = responseJson?.data.shop.metafield;
    const currencyCode = responseJson?.data.shop.currencyCode;

    const settings = metafield
      ? (metafield.jsonValue as InvoiceSettings)
      : null;
    if (!settings) {
      return new Response("No settings setup yet!", { status: 200 });
    }
    const customerName =
      `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim();
    const billingAddress = order.billing_address || {};
    const invoiceProps = {
      businessName: settings?.businessName,
      address: settings?.address,
      phone: settings?.phone,
      email: settings?.email,

      invoiceNumber: order.order_number.toString(),
      invoicePrefix: settings?.invoicePrefix,
      invoiceDate: new Date(order.created_at).toLocaleDateString(),
      dueDate: new Date().toLocaleDateString(),
      currency: currencyCode,

      customerName: customerName || billingAddress.name || "Customer",
      customerAddress: [
        billingAddress.address1,
        billingAddress.address2,
        `${billingAddress.city}, ${billingAddress.province} ${billingAddress.zip}`,
        billingAddress.country,
      ]
        .filter(Boolean)
        .join("\n"),
      customerEmail: order.email,

      paymentMethod:
        (order.payment_gateway_names || []).join(", ") || "Online Payment",
      paymentDetails: `Order #: ${order.name}`,

      items: order.line_items.map((item) => ({
        description: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),

      showTaxColumn: settings?.showTaxColumn,

      termsAndConditions: settings?.termsAndConditions,
      footerText: settings?.footerText,
      taxTotal: order.tax_lines.reduce((a, b) => a + b.price, 0),
      subTotal: order.subtotal_price_set.shop_money.amount,
    };
    const pdfStream = await renderToStream(<InvoicePdf {...invoiceProps} />);
    const chunks = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);
    await mailer.sendMail({
      from: "contact@iliashaddad.com",
      to: order.email,
      subject: `Your invoice for order #${order.name} is ready!`,
      text: `Dear ${customerName || "Customer"},\n\nThank you for your purchase! Your order has been delivered, and your invoice is attached to this email.\n\nOrder Number: ${order.name}\nDate: ${new Date(order.created_at).toLocaleDateString()}\nTotal: ${order.currency} ${order.total_price}\n\nPlease don't hesitate to contact us if you have any questions about your order.\n\nBest regards,\n${shop} Team`,
      attachments: [
        {
          filename: `Invoice-${order.name}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {}

  return new Response();
};
