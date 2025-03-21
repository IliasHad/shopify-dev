import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const referer = request.headers.get("referer");
  const productHandle = referer
    ?.split("/")
    [referer.split("/").length - 1].split("?")[0];
  const { admin } = await authenticate.public.appProxy(request);

  if (!admin) {
    return new Response(null, { status: 200 });
  }
  const response = await admin.graphql(
    `
      query GET_PRODUCT_BUNDLES($query: String!) {
        products(query: $query, first: 1) {
          edges {
            node {
              bundledComponentData: metafield(
                namespace: "$app:bundles"
                key: "function-configuration"
              ) {
                type
                jsonValue
              }
            }
          }
        }
      }
`,
    {
      variables: {
        query: `handle:${productHandle}`,
      },
    },
  );
  const { data } = await response.json();
  return json({
    bundles: data.products.edges[0].node.bundledComponentData.jsonValue.bundles,
  });
};
