import { useEffect, useState } from "react";
import {
  reactExtension,
  useApi,
  AdminAction,
  BlockStack,
  Button,
  Text,
  Select,
  TextField,
} from "@shopify/ui-extensions-react/admin";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = "admin.product-details.action.render";

export default reactExtension(TARGET, () => <App />);

function App() {
  // The useApi hook provides access to several useful APIs like i18n, close, and data.
  const { i18n, close, data } = useApi(TARGET);
  console.log({ data });
  const [productTitle, setProductTitle] = useState("");
  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [checkoutLink, setCheckoutLink] = useState(null);
  // Use direct API calls to fetch data from Shopify.
  // See https://shopify.dev/docs/api/admin-graphql for more information about Shopify's GraphQL API
  useEffect(() => {
    (async function getProductInfo() {
      const getProductQuery = {
        query: `query Product($id: ID!) {
  product(id: $id) {
    title
    variants(first: 10) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
}`,
        variables: { id: data.selected[0].id },
      };

      const res = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify(getProductQuery),
      });

      if (!res.ok) {
        console.error("Network error");
      }

      const productData = await res.json();
      setProductTitle(productData.data.product.title);
      setProductVariants(productData.data.product.variants.edges);
      setSelectedVariant(productData.data.product.variants.edges[0].node.id);
    })();
  }, [data.selected]);

  const handleGenerateCheckoutLink = async () => {
    const res = await fetch("api/generate-checkout-link", {
      method: "POST",
      body: JSON.stringify({
        variantId: selectedVariant,
        quantity: quantity,
      }),
    });
    if (!res.ok) {
      console.error("Network error");
    }
    const data = await res.json();
    console.log(data);
    if (data.checkoutLink) {
      setCheckoutLink(data.checkoutLink);
    }
  };
  return (
    // The AdminAction component provides an API for setting the title and actions of the Action extension wrapper.
    <AdminAction
      primaryAction={
        <Button
          onPress={handleGenerateCheckoutLink}
        >
          Generate Checkout Link
        </Button>
      }
      secondaryAction={
        <Button
          onPress={() => {
            console.log("closing");
            close();
          }}
        >
          Close
        </Button>
      }
    >
      <BlockStack>
        {/* Set the translation values for each supported language in the locales directory */}
        <Text fontWeight="bold">{i18n.translate("welcome", { TARGET })}</Text>
        <Text>Current product: {productTitle}</Text>
        <Text>Selected variant: {selectedVariant}</Text>
        <Select
          options={productVariants.map((variant) => ({
            value: variant.node.id,
            label: variant.node.title,
          }))}
          onChange={(value) => setSelectedVariant(value)}
          label="Select a variant"
        />
        <TextField
          type="number"
          value={quantity.toString()}
          onChange={(value) => setQuantity(parseFloat(value))}
          label="Quantity"
        />
        {checkoutLink && <Text>Checkout link: {checkoutLink}</Text>}
      </BlockStack>
    </AdminAction>
  );
}
