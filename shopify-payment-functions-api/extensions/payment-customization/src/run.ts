import type { RunInput, FunctionRunResult } from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

type Configuration = {
  countryCode: string;
  paymentMethod: string;
};

export function run(input: RunInput): FunctionRunResult {
  const configuration: Configuration = JSON.parse(
    input?.paymentCustomization?.metafield?.value ?? "{}",
  );
  if (configuration.countryCode !== input.localization.country.isoCode) {
    const paymentMethod = input.paymentMethods.find(
      (paymentMethod) => paymentMethod.name === configuration.paymentMethod || paymentMethod.name.includes(configuration.paymentMethod),
    );

    if (!paymentMethod) {
      return NO_CHANGES;
    }

    if (paymentMethod) {
      return {
        operations: [
          {
            hide: {
              paymentMethodId: paymentMethod.id,
            },
          },
        ],
      };
    }
  }
  return NO_CHANGES;
}
