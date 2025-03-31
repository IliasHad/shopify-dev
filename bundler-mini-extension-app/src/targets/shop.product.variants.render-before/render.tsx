import {BundleCollection} from '@shopify/shop-minis-ui-extensions'
import {useShopActions} from '@shopify/shop-minis-platform-sdk/actions'
import {useState} from 'react'

import type {ProductVariantsRenderBeforeQueryData} from './input.graphql'
import type {Bundle} from './types'

export function Render({
  extensionData,
}: {
  extensionData: ProductVariantsRenderBeforeQueryData | null
}) {
  const {updateLineItemAttributes} = useShopActions()
  const bundles: Bundle[] = extensionData?.product?.bundledComponentData
    ? JSON.parse(extensionData?.product?.bundledComponentData.value).bundles
    : []
  const [selectedBundle, setSelectedBundle] = useState<null | number>(null)

  if (bundles.length > 0) {
    return (
      <BundleCollection
        title="Bundles"
        bundles={bundles.map((bundle, bundleIndex) => ({
          title: bundle.displayText,
          subtitle: `Select this bundle and save ${bundle.selectedProducts[0].offer}%`,
          imageUrls: bundle.selectedProducts.map(
            product => product.featuredImage
          ),
          badgeText: `Save ${bundle.selectedProducts[0].offer}%`,
          actionButtonText:
            selectedBundle === bundleIndex
              ? 'Selected (click on add to cart)'
              : 'Select this bundle',
          onActionButtonPress: async () => {
            setSelectedBundle(bundleIndex)

            try {
              await updateLineItemAttributes({
                lineItemAttributes: [
                  {
                    key: '_bundleIndex',
                    value: bundleIndex.toString(),
                  },
                  {
                    key: 'bundle_title',
                    value: bundle.displayText,
                  },
                ],
                attribution: {
                  sourceName: 'Shopify App',
                  sourceIdentifier: 'Bundles',
                },
              })
            } catch (error) {
              console.error(
                'Error while adding to cart or buying product:',
                error
              )
            }
          },
        }))}
      />
    )
  }
}
