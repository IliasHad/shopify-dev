import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { Form, useActionData, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const countryCode = formData.get("countryCode");
  const paymentMethod = formData.get("paymentMethod");
  console.log({ countryCode, paymentMethod });

  const response = await admin.graphql(
    `mutation createPaymentCustomization($input: PaymentCustomizationInput!) {
      paymentCustomizationCreate(paymentCustomization: $input) {
        paymentCustomization {
          id
        }
        userErrors {
          message
        }
      }
    }`,
    {
      variables: {
        input: {
          functionId: process.env.SHOPIFY_PAYMENT_CUSTOMIZATION_ID,
          title: `Show ${paymentMethod} for ${countryCode}`,
          enabled: true,
          metafields: [
            {
              namespace: "$app:payment-customization",
              key: "function-configuration",
              type: "json",
              value: JSON.stringify({
                countryCode,
                paymentMethod,
              }),
            },
          ],
        },
      },
    },
  );
  const { data } = await response.json();
  if (data.paymentCustomizationCreate.userErrors.length > 0) {
    return json({ errors: data.data.paymentCustomizationCreate.userErrors });
  }

  return json({ success: true });
};

export default function Index() {
  const [countryCode, setCountryCode] = useState("MA");
  const [paymentMethod, setPaymentMethod] = useState("Cash On Delivery");
  const submit = useSubmit();
  const handleSubmit = async () => {
    submit({ countryCode, paymentMethod }, { method: "post" });
  };
  const actionData = useActionData<typeof action>();
  useEffect(() => {
    if (actionData?.success) {
      open("shopify:admin/settings/payments/customizations", "_top");
    }
  }, [actionData]);
  return (
    <Page
      title="Show a specific payment method for a specific country"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
      }}
    >
      <Layout>
        {actionData?.errors && (
          <Layout.Section>
            <Card>
              {actionData.errors.map((error, index) => (
                <p key={index}>{error.message}</p>
              ))}
            </Card>
          </Layout.Section>
        )}
        {actionData?.success && (
          <Layout.Section>
            <Badge tone="success">
              Payment customization created successfully
            </Badge>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <Form method="post">
              <FormLayout>
                <FormLayout.Group>
                  <TextField
                    requiredIndicator
                    label="Specific Country Code (ISO)"
                    value={countryCode}
                    onChange={setCountryCode}
                    autoComplete="off"
                  />
                  <TextField
                    requiredIndicator
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    autoComplete="off"
                  />
                </FormLayout.Group>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
