import type { RunInput, FunctionRunResult } from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

type Transform = {
  targetVariantId: string;
  addOnVaraintId: string;
  addOnPrice: string;
  bundleTitle: string;
};

export function run(input: RunInput): FunctionRunResult {
  const transforms: Transform[] = JSON.parse(
    input.cartTransform.metafield?.jsonValue.transforms || "[]",
  );
  console.log("Transforms:", JSON.stringify(transforms, null, 2));

  const targetLineItem = input.cart.lines.find((line) => {
    return transforms.some((transform) => {
      if (line.merchandise.__typename === "ProductVariant") {
        return line.merchandise.id === transform.targetVariantId;
      }
      return false;
    });
  });
  const targetTransform = transforms.find((transform) => {
    if (targetLineItem?.merchandise.__typename === "ProductVariant") {
      return targetLineItem?.merchandise.id === transform.targetVariantId;
    }
    return false;
  });
  if (
    targetLineItem &&
    targetTransform &&
    targetLineItem.merchandise.__typename === "ProductVariant"
  ) {
    return {
      operations: [
        {
          expand: {
            cartLineId: targetLineItem.id,
            title: targetTransform.bundleTitle,
            expandedCartItems: [
              {
                merchandiseId: targetLineItem.merchandise.id,
                quantity: targetLineItem.quantity,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: targetLineItem.cost.amountPerQuantity.amount,
                    },
                  },
                },
              },
              {
                merchandiseId: targetTransform.addOnVaraintId,
                quantity: targetLineItem.quantity,
                price: {
                  adjustment: {
                    fixedPricePerUnit: {
                      amount: targetTransform.addOnPrice,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    };
  }

  return NO_CHANGES;
}
