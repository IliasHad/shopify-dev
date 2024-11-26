import { type ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "../../shopify.server";
import axios from "axios";
import { json } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, payload } = await authenticate.flow(request);

  const customerId = payload.properties.customer_id;

  const blackListTag = payload.properties.blacklist_tag;
  const whiteListTag = payload.properties.whitelist_tag;

  console.log("customerId", customerId);
  console.log("blackListTag", blackListTag);
  console.log("whiteListTag", whiteListTag);

  try {
    const response = await admin.graphql(
      `
        #graphql
            query CUSTOMER_EMAIL($id: ID!) {
                customer(id: $id) {
                    email
                }
                }
            `,
      {
        variables: {
          id: customerId,
        },
      },
    );

    const { data } = await response.json();
    console.log("data", data);
    const customerEmail = data.customer.email;
    console.log("customerEmail", customerEmail);

    const config = {
      method: "get",
      url: `https://api.blacklistchecker.com/check/${customerEmail}`,
      headers: {
        Authorization: "Basic YOUR_API_KEY",
      },
    };
    const blackListCheck = await axios.request(config);
    console.log("blackListCheck", blackListCheck.data);
    const isBlackListed = blackListCheck.data.detections > 0;
    console.log("isBlackListed", isBlackListed);

    const tagAdd = await admin.graphql(
      `
        #graphql
        mutation CUSTOMER_TAG_ADD($id: ID!, $tag: String!) {
  tagsAdd(id: $id, tags: [$tag]) {
    node {
      id
    }
    userErrors {
      field
      message
    }
  }
}`,
      {
        variables: {
          id: customerId,
          tag: isBlackListed ? blackListTag : whiteListTag,
        },
      },
    );
    const tagAddResponse = await tagAdd.json();
    console.log("tagAddResponse", tagAddResponse);
    if (tagAddResponse.data.tagsAdd.userErrors.length > 0) {
      throw new Error("Failed to add tag");
    }
    return json({ success: true });
  } catch (error) {
    console.log("error", error);
    return json({ success: false });
  }

};
