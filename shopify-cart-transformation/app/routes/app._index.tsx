import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  FormLayout,
  InlineStack,
  TextField,
  Button,
  Divider,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import { json } from "@remix-run/node";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(`
      query cartTransforms{
  cartTransforms(first: 1) {
    edges {
      node {
        id
        functionId
        metafields(first:1) {
          edges {
            node {
              namespace
              key
              value
              jsonValue
            }
          }
        }
      }
    }
  }
}`);
    const { data } = await response.json();
    console.log(data);
    const transforms = JSON.parse(
      data.cartTransforms.edges[0].node.metafields.edges[0].node.jsonValue
        .transforms || "[]",
    );
    return json({
      cartTransformId: data.cartTransforms.edges[0].node.id,
      defaultTransforms: transforms,
    });
  } catch (error) {
    console.error(error);
    return json({ cartTransformId: "", defaultTransforms: [] });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const cartTransformId = formData.get("cartTransformId");
  const transforms = formData.get("transforms");
  console.log("Transforms:", transforms);
  console.log("Cart Transform ID:", cartTransformId);

  if (cartTransformId) {
    const response = await admin.graphql(
      `
    mutation updateMetafield($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    userErrors {
      message
      code
    }
  }
}`,
      {
        variables: {
          metafields: [
            {
              ownerId: cartTransformId,
              key: "functions-configurations",
              namespace: "$app:cart-transforms",
              value: JSON.stringify({ transforms }),
              type: "json",
            },
          ],
        },
      },
    );
    const { data } = await response.json();

    if (data.metafieldsSet.userErrors.length > 0) {
      return json({ errors: data.metafieldsSet.userErrors });
    }
    return json({ success: true });
  }

  const response = await admin.graphql(
    `mutation CartTransformCreate($functionId: String!, $metafields: [MetafieldInput!]!, $blockOnFailure: Boolean!) {
      cartTransformCreate(
        functionId: $functionId
        metafields: $metafields
        blockOnFailure: $blockOnFailure
      ) {
        userErrors {
          field
          message
        }
        cartTransform {
          id
        }
      }
    }
    `,
    {
      variables: {
        functionId: process.env.SHOPIFY_CART_TRANSFORMER_ID,
        metafields: [
          {
            key: "functions-configurations",
            namespace: "$app:cart-transforms",
            value: JSON.stringify({ transforms }),
            type: "json",
          },
        ],
        blockOnFailure: true,
      },
    },
  );

  const { data } = await response.json();
  console.log(data);
  if (data.cartTransformCreate.userErrors.length > 0) {
    return json({ errors: data.cartTransformCreate.userErrors });
  }
  return json({ success: true });
};

export default function Index() {
  const { defaultTransforms, cartTransformId } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ success: boolean; errors: [] }>();
  const [currentTargetVariantId, setCurrentTargetVariantId] = useState("");
  const [currentAddOnVariantId, setCurrentAddOnVariantId] = useState("");
  const [currentAddOnPrice, setCurrentAddOnPrice] = useState("");
  const [currentBundleTitle, setCurrentBundleTitle] = useState("");
  const [transforms, setTransforms] = useState(defaultTransforms);
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const handleSubmit = () => {
    const newTransforms = [...transforms];

    console.log("Submit");
    if (
      currentAddOnPrice !== "" &&
      currentAddOnVariantId !== "" &&
      currentTargetVariantId !== "" &&
      currentBundleTitle !== ""
    ) {
      newTransforms.push({
        targetVariantId: currentTargetVariantId,
        addOnVaraintId: currentAddOnVariantId,
        addOnPrice: currentAddOnPrice,
        bundleTitle: currentBundleTitle,
      });
    }
    submit(
      { transforms: JSON.stringify(newTransforms), cartTransformId },
      { method: "post" },
    );
  };

  const shopify = useAppBridge();

  const handleShowVariantPicker = async () => {
    console.log("Show Variant Picker");

    const product = await shopify.resourcePicker({
      type: "product",
      multiple: false,
    });
    console.log(product[0]);
    if (product) {
      setCurrentTargetVariantId(product[0].variants[0].id);
    }
  };
  const handleAddonVariantPicker = async () => {
    console.log("Show Addon Variant Picker");
    const product = await shopify.resourcePicker({
      type: "product",
      multiple: false,
    });
    console.log(product);
    if (product) {
      setCurrentAddOnVariantId(product[0].variants[0].id);
    }
  };
  return (
    <Page
      title="Product Bundles"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
      {actionData?.success && (
        <Banner tone="success">Successfully saved the changes</Banner>
      )}
      {actionData?.errors && (
        <Banner tone="critical">
          {actionData.errors.map((error) => (
            <p key={error.field}>{error.message}</p>
          ))}
        </Banner>
      )}
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              {transforms.map((transform, index) => (
                <InlineStack key={index} gap="500">
                  <TextField
                    label="Target Variant ID"
                    type="text"
                    autoComplete="off"
                    value={transform.targetVariantId}
                    onChange={(value) => {
                      const newTransforms = [...transforms];
                      newTransforms[index].targetVariantId = value;
                      setTransforms(newTransforms);
                    }}
                  />
                  <TextField
                    label="Add On Variant ID"
                    type="text"
                    autoComplete="off"
                    value={transform.addOnVaraintId}
                    onChange={(value) => {
                      const newTransforms = [...transforms];
                      newTransforms[index].addOnVaraintId = value;
                      setTransforms(newTransforms);
                    }}
                  />
                  <TextField
                    label="Add On Price"
                    type="text"
                    autoComplete="off"
                    value={transform.addOnPrice}
                    onChange={(value) => {
                      const newTransforms = [...transforms];
                      newTransforms[index].addOnPrice = value;
                      setTransforms(newTransforms);
                    }}
                  />
                  <TextField
                    label="Bundle Title"
                    type="text"
                    autoComplete="off"
                    value={transform.bundleTitle}
                    onChange={(value) => {
                      const newTransforms = [...transforms];
                      newTransforms[index].bundleTitle = value;
                      setTransforms(newTransforms);
                    }}
                  />
                  <BlockStack align="center">
                    <Button
                      tone="critical"
                      onClick={() => {
                        const newTransforms = [...transforms];
                        newTransforms.splice(index, 1);
                        setTransforms(newTransforms);
                      }}
                    >
                      Remove
                    </Button>
                  </BlockStack>
                </InlineStack>
              ))}
            </Card>
            <div style={{ height: "20px" }} />
            <Divider />
            <Card>
              <Form method="post">
                <FormLayout>
                  <InlineStack gap={"500"}>
                    <BlockStack align="center" gap={"500"}>
                      <TextField
                        label="Target Variant ID"
                        type="text"
                        autoComplete="off"
                        value={currentTargetVariantId}
                        onChange={setCurrentTargetVariantId}
                      />
                      <Button onClick={handleShowVariantPicker}>
                        Select Variant
                      </Button>
                    </BlockStack>

                    <BlockStack align="center" gap={"500"}>
                      <TextField
                        label="Add On Variant ID"
                        type="text"
                        autoComplete="off"
                        value={currentAddOnVariantId}
                        onChange={setCurrentAddOnVariantId}
                      />
                      <Button onClick={handleAddonVariantPicker}>
                        Select Variant
                      </Button>
                    </BlockStack>

                    <TextField
                      label="Add On Price"
                      type="text"
                      autoComplete="off"
                      value={currentAddOnPrice}
                      onChange={setCurrentAddOnPrice}
                    />
                    <TextField
                      label="Bundle Title"
                      type="text"
                      autoComplete="off"
                      value={currentBundleTitle}
                      onChange={setCurrentBundleTitle}
                    />
                    <BlockStack align="center">
                      <Button>Add a new bundle</Button>
                    </BlockStack>
                  </InlineStack>
                </FormLayout>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
