import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  if (!formData.has("weight") || !formData.has("shippingMethod")) {
    return new Response("Missing weight or shippingMethod", {
      status: 400,
    });
  }
  const weight = parseFloat(formData.get("weight"));
  const shippingMethod = formData.get("shippingMethod");

  console.log({ weight, shippingMethod });

  try {
    const response = await admin.graphql(
      `
    mutation createDeliveryCustomization($input: DeliveryCustomizationInput!) {
      deliveryCustomizationCreate(deliveryCustomization: $input) {
        deliveryCustomization {
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
            functionId: process.env.SHOPIFY_DELIVERY_CUSTOMIZATION_ID,
            title: `Hide ${shippingMethod}'s shipping method when weight is over ${weight} Kg`,
            enabled: true,
            metafields: [
              {
                namespace: "$app:delivery-customization",
                key: "function-configuration",
                type: "json",
                value: JSON.stringify({ weight, shippingMethod }),
              },
            ],
          },
        },
      },
    );
    const { data } = await response.json();
    console.log(data);
    if (data.deliveryCustomizationCreate.userErrors.length > 0) {
      return json({ errors: data.deliveryCustomizationCreate.userErrors });
    } else {
      return json({ success: true });
    }
  } catch (error) {
    console.error(error);
    return json({ errors: [{ message: "An error occurred" }] });
  }
};

export default function Index() {
  const [weight, setWeight] = useState(1);
  const submit = useSubmit();
  const [shippingMethod, setShippingMethod] = useState("standard");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const handleSubmit = async () => {
    submit({ weight, shippingMethod }, { method: "post" });
  };
  return (
    <Page
      title="Hide a specific shipping method when an item in the order is over the limit"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
      <Layout>
        {actionData?.errors && (
          <Banner tone="warning">
            <p>There was an error</p>
            <ul>
              {actionData.errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </Banner>
        )}
        {actionData?.success && (
          <Banner tone="success">
            <p>Delivery customization created successfully</p>
          </Banner>
        )}
        <Layout.Section>
          <Card>
            <Form method="post">
              <FormLayout>
                <TextField
                  label="Item Weight (Kg)"
                  type="number"
                  value={weight.toString()}
                  onChange={(value) => setWeight(parseFloat(value))}
                  autoComplete="off"
                />
                <TextField
                  label="Shipping method"
                  type="text"
                  value={shippingMethod}
                  onChange={(value) => setShippingMethod(value)}
                  autoComplete="off"
                />
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
