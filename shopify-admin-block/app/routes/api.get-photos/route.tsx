import { authenticate } from "../../shopify.server";
import axios from "axios";
import { json } from "@remix-run/node";

export const action = async ({ request }: { request: Request }) => {
  const { cors } = await authenticate.admin(request);

  const clientId = "YOUR_UNSPLASH_CLIENT_ID";

  const payload = await request.json();
  const { productTitle } = payload;

  try {
    let config = {
      method: "get",
      url: `https://api.unsplash.com/search/photos/?client_id=${clientId}&query=${productTitle}&per_page=5`,
    };

    const res = await axios.request(config);
    const data = res.data;

    const productPhotos = data.results.map((photo: any) => photo.urls.regular);
    console.log({ productPhotos });
    return cors(json({ productPhotos }));
  } catch (error) {
    console.log(error);
  }
};
