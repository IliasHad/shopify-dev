import { memo, useState } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Text,
  TextField,
  Checkbox,
  Toast,
  Frame,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  type LoaderFunctionArgs,
  json,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { PDFViewer } from "@react-pdf/renderer";
import { type InvoiceSettings } from "app/types";
import { InvoicePdf } from "app/templates/invoice";

interface PDFPreviewProps {
  previewSettings: InvoiceSettings | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(`
      query {
        shop {
          metafield(namespace: "invoice_customizer", key: "settings") {
            jsonValue
          }
        }
      }
    `);

    const responseJson = await response.json();
    const metafield = responseJson.data.shop.metafield;

    return json({
      settings: metafield ? (metafield.jsonValue as InvoiceSettings) : null,
    });
  } catch (error) {
    console.error("Error fetching metafields:", error);
    return json({ settings: null });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const settings = JSON.parse(formData.get("settings") as string);

  try {
    const shopResponse = await admin.graphql(`
      query {
        shop {
          id
        }
      }
    `);

    const shopResponseJson = await shopResponse.json();
    const shopId = shopResponseJson.data.shop.id;
    const response = await admin.graphql(
      `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
      {
        variables: {
          metafields: [
            {
              namespace: "invoice_customizer",
              key: "settings",
              value: JSON.stringify(settings),
              type: "json",
              ownerId: shopId,
            },
          ],
        },
      },
    );

    const responseJson = await response.json();

    if (responseJson.data?.metafieldsSet?.userErrors?.length > 0) {
      return json({
        success: false,
        error: responseJson.data.metafieldsSet.userErrors[0].message,
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error saving metafields:", error);
    return json({
      success: false,
      error: "Failed to save settings",
    });
  }
};

const MemoizedPDFPreview = memo(({ previewSettings }: PDFPreviewProps) => {
  if (typeof window === "undefined" || !previewSettings) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed #ccc",
          borderRadius: "4px",
        }}
      >
        <Text as="p" variant="bodyMd">
          Click "Update Preview" to see your invoice design
        </Text>
      </div>
    );
  }

  return (
    <PDFViewer
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <InvoicePdf {...previewSettings} />
    </PDFViewer>
  );
});

export default function IndexPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(
    "Invoice template saved successfully",
  );
  const [toastError, setToastError] = useState(false);
  const [previewSettings, setPreviewSettings] =
    useState<InvoiceSettings | null>(null);
  const fetcher = useFetcher<typeof fetch>();

  const { settings: defaultSettings } = useLoaderData<typeof loader>();
  const [settings, setSettings] = useState<InvoiceSettings>({
    businessName: defaultSettings?.businessName || "Your Company Name",
    address: defaultSettings?.address || "",
    phone: defaultSettings?.phone || "",
    email: defaultSettings?.email || "",
    invoicePrefix: defaultSettings?.invoicePrefix || "INV-",
    showTaxColumn: defaultSettings?.showTaxColumn || true,
    termsAndConditions: defaultSettings?.termsAndConditions || "",
    footerText: defaultSettings?.footerText || "Thank you for your business!",
  });

  const handleSettingChange = (
    key: keyof InvoiceSettings,
    value: string | boolean,
  ) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const saveTemplate = () => {
    fetcher.submit({ settings: JSON.stringify(settings) }, { method: "post" });

    if (fetcher.data) {
      if ("success" in fetcher.data) {
        setToastMessage("Invoice template saved successfully");
        setToastError(false);
      } else {
        setToastMessage(
          `Error: ${fetcher.data.error || "Failed to save settings"}`,
        );
        setToastError(true);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const updatePreview = () => {
    setPreviewSettings(settings);
  };

  return (
    <Frame>
      <Page>
        <TitleBar title="Invoice Customizer" />

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                  Invoice Design
                </Text>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Company Information
                  </Text>
                  <TextField
                    label="Business Name"
                    value={settings.businessName}
                    onChange={(value) =>
                      handleSettingChange("businessName", value)
                    }
                    autoComplete="off"
                  />
                  <TextField
                    label="Address"
                    value={settings.address}
                    onChange={(value) => handleSettingChange("address", value)}
                    multiline={2}
                    autoComplete="off"
                  />
                  <InlineStack gap="300">
                    <div style={{ width: "50%" }}>
                      <TextField
                        label="Phone"
                        value={settings.phone}
                        onChange={(value) =>
                          handleSettingChange("phone", value)
                        }
                        autoComplete="off"
                      />
                    </div>
                    <div style={{ width: "50%" }}>
                      <TextField
                        label="Email"
                        value={settings.email}
                        onChange={(value) =>
                          handleSettingChange("email", value)
                        }
                        type="email"
                        autoComplete="off"
                      />
                    </div>
                  </InlineStack>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Invoice Options
                  </Text>
                  <InlineStack gap="300">
                    <div style={{ width: "50%" }}>
                      <TextField
                        label="Invoice Prefix"
                        value={settings.invoicePrefix}
                        onChange={(value) =>
                          handleSettingChange("invoicePrefix", value)
                        }
                        autoComplete="off"
                      />
                    </div>
                  </InlineStack>
                  <Checkbox
                    label="Show Tax Column"
                    checked={settings.showTaxColumn}
                    onChange={(value) =>
                      handleSettingChange("showTaxColumn", value)
                    }
                  />
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Footer
                  </Text>
                  <TextField
                    label="Terms and Conditions"
                    value={settings.termsAndConditions}
                    onChange={(value) =>
                      handleSettingChange("termsAndConditions", value)
                    }
                    multiline={3}
                    autoComplete="off"
                  />
                  <TextField
                    label="Footer Text"
                    value={settings.footerText}
                    onChange={(value) =>
                      handleSettingChange("footerText", value)
                    }
                    autoComplete="off"
                  />
                </BlockStack>

                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    onClick={saveTemplate}
                    loading={fetcher.state === "submitting"}
                  >
                    Save Template
                  </Button>
                  <Button variant="secondary" onClick={updatePreview}>
                    Update Preview
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Invoice Preview
                </Text>

                <div
                  style={{
                    height: "100vh",
                  }}
                >
                  <MemoizedPDFPreview previewSettings={previewSettings} />
                </div>

                <Text as="p" variant="bodySm">
                  This preview will update when you click "Update Preview". Your
                  customers will receive this invoice automatically when their
                  order is marked as delivered.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {showToast && (
          <Toast
            content={toastMessage}
            error={toastError}
            onDismiss={() => setShowToast(false)}
          />
        )}
      </Page>
    </Frame>
  );
}
