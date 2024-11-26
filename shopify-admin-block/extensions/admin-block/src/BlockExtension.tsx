import {
  reactExtension,
  useApi,
  AdminBlock,
  BlockStack,
  Text,
  Image,
  InlineStack,
} from "@shopify/ui-extensions-react/admin";

import { useEffect, useState } from "react";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = "admin.product-details.block.render";

export default reactExtension(TARGET, () => <App />);

function App() {
  // The useApi hook provides access to several useful APIs like i18n and data.
  const { i18n, data } = useApi(TARGET);
  console.log({ data });

  const [productTitle, setProductTitle] = useState("");
  const [productPhotos, setProductPhotos] = useState([]);
  useEffect(() => {
    if (productTitle === "") return;
    const fetchProductPhotos = async () => {
      const res = await fetch("api/get-photos", {
        method: "POST",
        body: JSON.stringify({
          productTitle,
        }),
      });

      const { productPhotos } = await res.json();
      console.log({ productPhotos });
      setProductPhotos(productPhotos);
    };

    fetchProductPhotos();
  }, [productTitle]);

  useEffect(() => {
    const fetchProductTitle = async () => {
      const query = `
      query GET_PRODUCT_BY_BY_ID($id: ID!) {
  product(id: $id) {
    title
  }
}
      `;

      const res = await fetch(`shopify:admin/api/graphql.json`, {
        method: "POST",
        body: JSON.stringify({
          query,
          variables: {
            id: data.selected[0].id,
          },
        }),
      });

      const { data: productData } = await res.json();
      console.log({ productData });
      setProductTitle(productData.product.title);
    };
    fetchProductTitle();
  }, [data]);

  return (
    // The AdminBlock component provides an API for setting the title of the Block extension wrapper.
    <AdminBlock title="Unsplash Product Photos">
      <BlockStack>
        <Text fontWeight="bold">
          Unsplash Product Photos for {productTitle}
        </Text>
        <Text fontWeight="bold">
          We found {productPhotos.length} photos for this product
        </Text>
        <InlineStack gap={"large large"} blockAlignment="center">
          {productPhotos.map((photo, index) => (
            <Image key={index} source={photo} alt={`Photo ${index}`} />
          ))}
        </InlineStack>
      </BlockStack>
    </AdminBlock>
  );
}
