import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Page, Card, EmptyState } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  json,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(`
      query cartTransforms {
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
    return json({
      cartTransformId: data.cartTransforms.edges[0].node.id,
    });
  } catch (error) {
    console.error(error);
    return json({ cartTransformId: null });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const res = await admin.graphql(
      `
      mutation CartTransformCreate($functionId: String!, $blockOnFailure: Boolean!) {
  cartTransformCreate(functionId: $functionId, blockOnFailure: $blockOnFailure) {
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
          blockOnFailure: true,
        },
      },
    );

    const { data } = await res.json();
    if (data.cartTransformCreate.userErrors.length > 0) {
      console.log(data.cartTransformCreate.userErrors)
      return json({
        success: false,
      });
    }
    console.log(data.cartTransformCreate)
    return json({
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
  return null;
};

export default function Index() {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const handleActivation = () => {
    submit({}, { method: "POST" });
  };
  const { cartTransformId } = useLoaderData<typeof loader>();
  return (
    <Page>
      <TitleBar title="Bundle App"></TitleBar>
      <Card>
        {!cartTransformId && (
          <EmptyState
            heading="Create product bundle"
            action={{
              content: "Active Cart Transform API",
              onAction: handleActivation,
              disabled: isLoading,
              loading: isLoading,
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Manage and create product bundled.</p>
            </EmptyState>
        )}
        {cartTransformId && (
          <EmptyState
            heading="Create product bundle"
            action={{
              content: "Create your bundle",
              url: "/app/bundles/new",
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Manage and create product bundled.</p>
          </EmptyState>
        )}
      </Card>
    </Page>
  );
}
