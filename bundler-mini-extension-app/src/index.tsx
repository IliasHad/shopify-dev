import {MiniAppConfig} from '@shopify/shop-minis-platform-sdk'

import {App} from './App'
import {Render as ProductVariantsRenderBefore} from './targets/shop.product.variants.render-before/render'

const config: MiniAppConfig = {
  ViewerRoot: App,

  Targets: {
    'shop.product.variants.render-before': ProductVariantsRenderBefore,
  },
}

export default config
