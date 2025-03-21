import type { RunInput, FunctionRunResult } from "../generated/api";

interface BundleVariant {
  id: string;
  quantity: number;
  originalPrice: number;
}

interface BundleProduct {
  variants: BundleVariant[];
  title: string;
  featuredImage: string;
  offer: number;
  quantity: number;
}

interface Bundle {
  displayText: string;
  offer: number;
  selectedProducts: BundleProduct[];
}

interface BundledComponentData {
  jsonValue: {
    bundles: Bundle[];
  };
}

interface ProductVariantMerchandise {
  __typename: "ProductVariant";
  id: string;
  product: {
    __typename: "Product";
    bundledComponentData: BundledComponentData | null;
  };
}

interface CartLineBundleIndex {
  value?: string;
}

interface CartLineCost {
  amountPerQuantity: {
    amount: number;
  };
}

interface CartLine {
  id: string;
  merchandise: ProductVariantMerchandise;
  bundleIndex?: CartLineBundleIndex | null;
  cost: CartLineCost;
}

interface ExpandedCartItem {
  merchandiseId: string;
  quantity: number;
  price: {
    adjustment: {
      fixedPricePerUnit: {
        amount: string;
      };
    };
  };
}

interface ExpandOperation {
  cartLineId: string;
  expandedCartItems: ExpandedCartItem[];
  title: string;
}

interface Operation {
  expand: ExpandOperation;
}

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

export function run(input: RunInput): FunctionRunResult {
  const operations: Operation[]  = input.cart.lines.reduce(
    (acc, cartLine: CartLine) => {
      const expandOperation = optionallyBuildExpandOperation(cartLine, input.presentmentCurrencyRate);

      if (expandOperation) {
        return [...acc, { expand: expandOperation }];
      }

      return acc;
    },
    []
  );

  return operations.length > 0 ? { operations } : NO_CHANGES;
}

function optionallyBuildExpandOperation(
  { id: cartLineId, merchandise, bundleIndex, cost }: CartLine,
  presentmentCurrencyRate: number
): ExpandOperation | undefined {
  if (
    merchandise.__typename === "ProductVariant" &&
    merchandise.product.bundledComponentData &&
    bundleIndex
  ) {
    const bundleData: Bundle[] =
      merchandise.product.bundledComponentData.jsonValue.bundles;

    if (bundleData.length === 0) {
      throw new Error("Invalid bundle composition");
    }

    const variants: BundleVariant[] = [];
    const selectedBundleIndex = bundleIndex?.value ? parseInt(bundleIndex?.value) : 0
    const selectedBundle = bundleData[selectedBundleIndex];

    if (!selectedBundle) {
      return undefined;
    }

    for (const product of selectedBundle.selectedProducts) {
      for (const variant of product.variants) {
        variants.push({
          id: variant.id,
          quantity: variant.quantity,
          originalPrice: variant.originalPrice,
        });
      }
    }

    const expandedCartItems: ExpandedCartItem[] = variants.map((variant) => ({
      merchandiseId: variant.id,
      quantity: variant.quantity || 1,
      price: {
        adjustment: {
          fixedPricePerUnit: {
            amount: (
              ((selectedBundle.offer || 10) / 100) *
              cost.amountPerQuantity.amount *
              presentmentCurrencyRate
            ).toFixed(2),
          },
        },
      },
    }));

    if (expandedCartItems.length > 0) {
      return {
        cartLineId,
        expandedCartItems,
        title: selectedBundle.displayText,
      };
    }
  }
  
  return undefined;
}