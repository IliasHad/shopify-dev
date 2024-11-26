import type { RunInput, FunctionRunResult } from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

type Configuration = {
  weight: number;
  shippingMethod: string;
};

export function run(input: RunInput): FunctionRunResult {
  const configuration: Configuration = JSON.parse(
    input?.deliveryCustomization?.metafield?.value ?? "{}",
  );

  const cartItems = input.cart.lines;
  const totalWeight = cartItems.reduce(
    (acc, line) => acc + line.merchandise.weight,
    0,
  );
  if (totalWeight >= configuration.weight) {
    const shippingMethodHandle =
      input.cart.deliveryGroups[0].deliveryOptions.find(
        (option) => option.title === configuration.shippingMethod,
      )?.handle;
    if (shippingMethodHandle) {
      return {
        operations: [
          {
            hide: {
              deliveryOptionHandle: shippingMethodHandle,
            },
          },
        ],
      };
    }
  }

  return NO_CHANGES;
}
