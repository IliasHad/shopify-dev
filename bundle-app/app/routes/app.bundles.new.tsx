import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  TextField,
  ChoiceList,
  Button,
  Box,
  Checkbox,
  Thumbnail,
  Tag,
  InlineGrid,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useCallback, useEffect, useState } from "react";
import {
  validateBundleForm,
  type ValidationErrors,
} from "app/validators/bundleForm";
import type { SelectedProduct, ShopifyProduct } from "app/@types/bundle";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const validation = validateBundleForm(formData);

  if (validation.errors) {
    return json({
      success: false,
      errors: validation.errors,
    });
  }

  const {
    bundleName,
    displayText,
    showComparisonPrice,
    directToCheckout,
    selectedProducts,
  } = validation.data!;

  const metafields = [];
  const parsedProducts = JSON.parse(selectedProducts);

  for (const product of parsedProducts) {
    const response = await admin.graphql(
      `
      query GET_PRODUCT_BUNDLES($id: ID!) {
        product(id: $id) {
              bundledComponentData: metafield(
                namespace: "$app:bundles"
                key: "function-configuration"
              ) {
                type
                jsonValue
              }
            }
      }
      
      `,
      {
        variables: {
          id: product.id,
        },
      },
    );
    const { data } = await response.json();
    const bundles = data.product.bundledComponentData?.jsonValue?.bundles || [];
    const metafield = {
      bundles: [
        ...bundles,
        {
          name: bundleName,
          displayText,
          selectedProducts: parsedProducts,
          showComparisonPrice,
          directToCheckout,
        },
      ],
    };

    metafields.push({
      ownerId: product.id,
      namespace: "$app:bundles",
      key: "function-configuration",
      value: JSON.stringify(metafield),
      type: "json",
    });
  }

  console.log(metafields);

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
        metafields: metafields,
      },
    },
  );
  const { data } = await response.json();

  if (data.metafieldsSet.userErrors.length > 0) {
    return json({
      success: false,
      errors: { message: data.metafieldsSet.userErrors[0].message },
    });
  }

  return json({ success: true });
};

export default function Index() {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const actionData = useActionData<{
    success: boolean;
    errors?: ValidationErrors & { message: string };
  }>();

  const [bundleName, setBundleName] = useState("");
  const [productSelection, setProductSelection] = useState("specificProducts");
  const [displayText, setDisplayText] = useState("Limited Offer");
  const [showComparisonPrice, setShowComparisonPrice] = useState(true);
  const [directToCheckout, setDirectToCheckout] = useState(false);
  const [offer, setOffer] = useState("10");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Yay!, Product Bundle Saved");
      setBundleName("");
      setDisplayText("Limited Offer");
      setOffer("10");
      setSelectedProducts([]);
      setFormErrors({});
    } else if (actionData?.errors) {
      setFormErrors(actionData.errors);
    }
    return () => {};
  }, [actionData]);

  const handleBundleNameChange = useCallback(
    (newValue: string) => {
      setBundleName(newValue);
      if (formErrors.bundleName) {
        setFormErrors({ ...formErrors, bundleName: undefined });
      }
    },
    [formErrors],
  );

  const handleProductSelectionChange = useCallback(
    (value: string) => setProductSelection(value),
    [],
  );

  const handleBlockTextChange = useCallback(
    (newValue: string) => {
      setDisplayText(newValue);
      if (formErrors.displayText) {
        setFormErrors({ ...formErrors, displayText: undefined });
      }
    },
    [formErrors],
  );

  const handleComparisonPriceChange = useCallback(
    (newChecked: boolean) => setShowComparisonPrice(newChecked),
    [],
  );

  const handleDirectToCheckoutChange = useCallback(
    (newChecked: boolean) => setDirectToCheckout(newChecked),
    [],
  );

  const validateClient = () => {
    const clientErrors: ValidationErrors = {};

    if (!bundleName.trim()) {
      clientErrors.bundleName = "Bundle name is required";
    }

    if (!displayText.trim()) {
      clientErrors.displayText = "Display text is required";
    }

    if (!/^\d+(\.\d+)?$/.test(offer)) {
      clientErrors.offer = "Offer must be a valid number";
    }

    if (selectedProducts.length === 0) {
      clientErrors.selectedProducts = "At least one product must be selected";
    }

    return Object.keys(clientErrors).length > 0 ? clientErrors : null;
  };

  const handleFormSubmit = useCallback(() => {
    const errors = validateClient();
    if (errors) {
      setFormErrors(errors);
      return;
    }

    const formData = {
      bundleName,
      displayText,
      offer,
      showComparisonPrice: showComparisonPrice.toString(),
      directToCheckout: directToCheckout.toString(),
      selectedProducts: JSON.stringify(selectedProducts),
    };

    submit(formData, { method: "post" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bundleName,
    displayText,
    offer,
    showComparisonPrice,
    directToCheckout,
    submit,
    selectedProducts,
  ]);

  const handleSelectCollection = async () => {
    const selections = await shopify.resourcePicker({
      type: "collection",
      action: "select",
      multiple: true,
    });
    console.log(selections);
  };

  const handleSelectProduct = async () => {
    const selections = (await shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
      filter: {
        query: "(gift_card:false) AND (inventory_total:>1)",
        variants: true,
      },
    })) as ShopifyProduct[];

    if (selections) {
      const selectedProducts: SelectedProduct[] = selections.map((product) => ({
        title: product.title,
        id: product.id,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          title: variant.title,
          quantity: 1,
          price: parseFloat(variant.price),
          originalPrice: parseFloat(variant.price),
        })),
        quantity: 1,
        featuredImage: product.images[0].originalSrc,
        offer: parseFloat(offer),
      }));
      setSelectedProducts(selectedProducts);

      if (formErrors.selectedProducts) {
        setFormErrors({ ...formErrors, selectedProducts: undefined });
      }
    } else {
      setSelectedProducts([]);
    }
  };

  return (
    <Page
      title="New Bundle"
      primaryAction={{
        content: "Create bundle",
        onAction: handleFormSubmit,
        disabled: isLoading,
        loading: isLoading,
      }}
    >
      <TitleBar title="Bundler App" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            {actionData?.errors?.message && (
              <Banner tone="critical">
                <p>{actionData.errors.message}</p>
              </Banner>
            )}
            <Form method="post">
              <BlockStack gap="400">
                <Card>
                  <TextField
                    label="Bundle Name (Internal)"
                    value={bundleName}
                    onChange={handleBundleNameChange}
                    autoComplete="off"
                    placeholder="Bundle Name"
                    name="bundleName"
                    error={formErrors.bundleName}
                  />
                </Card>
                <Card>
                  <TextField
                    label="Display Text"
                    value={displayText}
                    onChange={handleBlockTextChange}
                    autoComplete="off"
                    name="displayText"
                    error={formErrors.displayText}
                  />
                </Card>

                <Card>
                  <TextField
                    label="Bundle Offer"
                    type="number"
                    prefix="%"
                    autoComplete="off"
                    value={offer}
                    name="offer"
                    onChange={(value) => {
                      setOffer(value);
                      if (formErrors.offer) {
                        setFormErrors({ ...formErrors, offer: undefined });
                      }
                    }}
                    error={formErrors.offer}
                  />
                </Card>

                <Card>
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p">
                      Product or Collection Selection:
                    </Text>
                    <ChoiceList
                      title=""
                      titleHidden
                      name="productSelection"
                      choices={[
                        {
                          label: "Specific Products",
                          value: "specificProducts",
                        },
                        {
                          label: "Specific Collections",
                          value: "specificCollections",
                        },
                      ]}
                      selected={[productSelection]}
                      onChange={(values) =>
                        handleProductSelectionChange(values[0])
                      }
                    />
                    <InlineStack>
                      {productSelection === "specificProducts" && (
                        <Button onClick={handleSelectProduct} variant="primary">
                          Select A Product
                        </Button>
                      )}
                      {productSelection === "specificCollections" && (
                        <Button
                          variant="primary"
                          disabled
                          onClick={handleSelectCollection}
                        >
                          Select A Collection
                        </Button>
                      )}
                    </InlineStack>
                    {formErrors.selectedProducts && (
                      <Text as="h3" tone="critical">
                        {formErrors.selectedProducts}
                      </Text>
                    )}
                  </BlockStack>
                </Card>
                {selectedProducts.length > 0 && (
                  <Card>
                    <BlockStack gap={"600"}>
                      <Text as="h3" variant="headingMd">
                        Selected Products
                      </Text>
                      {selectedProducts.map((product, productIndex) => (
                        <Box
                          key={product.id}
                          borderColor="border-brand"
                          borderWidth="025"
                          padding={"300"}
                          borderRadius="050"
                        >
                          <InlineGrid columns={2} gap={"600"}>
                            <BlockStack gap={"500"}>
                              <InlineStack gap={"600"} blockAlign="center">
                                <Thumbnail
                                  source={product.featuredImage}
                                  alt={product.title}
                                  size="small"
                                />
                                <BlockStack gap={"200"}>
                                  <Text as="h3" variant="headingMd">
                                    {product.title}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              <BlockStack gap={"200"}>
                                <Text as="p" variant="bodyMd" alignment="start">
                                  Variants:
                                </Text>
                                <InlineStack gap={"200"}>
                                  {product.variants.map((variant) => (
                                    <Tag
                                      onRemove={() => {
                                        let newProducts = [...selectedProducts];
                                        newProducts[productIndex].variants =
                                          newProducts[
                                            productIndex
                                          ].variants.filter(
                                            (item) => item.id !== variant.id,
                                          );
                                        if (
                                          newProducts[productIndex].variants
                                            .length === 0
                                        ) {
                                          newProducts = newProducts.filter(
                                            (item) => item.id !== product.id,
                                          );
                                        }
                                        setSelectedProducts(newProducts);
                                      }}
                                      key={variant.id}
                                    >
                                      {variant.title}
                                    </Tag>
                                  ))}
                                </InlineStack>
                              </BlockStack>
                            </BlockStack>
                            <InlineStack
                              gap={"200"}
                              blockAlign="center"
                              align="end"
                            >
                              <div style={{ width: "80px" }}>
                                <TextField
                                  type="number"
                                  value={product.quantity.toString()}
                                  autoComplete="off"
                                  labelHidden
                                  label="Quantity"
                                  onChange={(value) => {
                                    let newProducts = [...selectedProducts];
                                    newProducts[productIndex].quantity =
                                      parseInt(value);
                                    newProducts[productIndex].variants =
                                      newProducts[productIndex].variants.map(
                                        (variant) => ({
                                          ...variant,
                                          quantity: parseInt(value),
                                        }),
                                      );

                                    setSelectedProducts(newProducts);
                                  }}
                                ></TextField>
                              </div>
                              <Box width="max-content">
                                <Button
                                  variant="secondary"
                                  tone="critical"
                                  onClick={() => {
                                    let newProducts = [...selectedProducts];
                                    newProducts = newProducts.filter(
                                      (item) => item.id !== product.id,
                                    );
                                    setSelectedProducts(newProducts);
                                  }}
                                >
                                  Remove
                                </Button>
                              </Box>
                            </InlineStack>
                          </InlineGrid>
                        </Box>
                      ))}
                    </BlockStack>
                  </Card>
                )}
                <Card>
                  <BlockStack gap="200"></BlockStack>
                  <Checkbox
                    label="Show Comparison Prices"
                    checked={showComparisonPrice}
                    onChange={handleComparisonPriceChange}
                    name="showComparisonPrice"
                    helpText="Show comparison price in the product page"
                  />

                  <Checkbox
                    label="Direct to Checkout"
                    checked={directToCheckout}
                    onChange={handleDirectToCheckoutChange}
                    name="directToCheckout"
                    helpText="Customer will be redirected directly to checkout"
                  />
                </Card>
                <Box>
                  <InlineStack gap="300" align="end">
                    <Button
                      variant="primary"
                      onClick={handleFormSubmit}
                      disabled={isLoading}
                      loading={isLoading}
                    >
                      Publish
                    </Button>
                  </InlineStack>
                </Box>
                <input
                  type="hidden"
                  name="selectedProducts"
                  value={JSON.stringify(selectedProducts)}
                />
              </BlockStack>
            </Form>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
