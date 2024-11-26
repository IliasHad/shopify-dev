import { authenticate } from "../../shopify.server";
import { json } from "@remix-run/node";

export const action = async ({ request }: { request: Request }) => {
  const { admin, cors } = await authenticate.admin(request);

  try {
    const payload = await request.json();
    const { variantId, quantity } = payload;
    if (!variantId || !quantity) {
      return {
        status: 400,
        body: {
          message: "Missing required fields",
        },
      };
    }

    const response = await admin.graphql(
      `
        mutation CreateDraftOrder($variantId: ID!, $quantity: Int!) {
  draftOrderCreate(
    input: {lineItems: [{variantId: $variantId, quantity: $quantity}]}
  ) {
    draftOrder {
      id
      invoiceUrl
    }
    userErrors {
      message
      field
    }
  }
}
        `,
      {
        variables: {
          variantId,
          quantity,
        },
      },
    );

    const { data } = await response.json();
    if (
      data.draftOrderCreate.userErrors.length === 0 &&
      data.draftOrderCreate.draftOrder
    ) {
      return cors(
        json({ checkoutLink: data.draftOrderCreate.draftOrder.invoiceUrl }),
      );
    }
  } catch (e) {
    return {
      status: 400,
      body: {
        message: "Invalid request",
      },
    };
  }
};
