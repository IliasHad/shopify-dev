export interface SelectedProduct {
  title: string
  id: string
  variants: ProductVariant[]
  quantity: number
  featuredImage: string
  offer: number
}

export interface ProductVariant {
  id: string
  title: string
  quantity: number
  price: number
  originalPrice: number
}

export interface Bundle {
  displayText: string
  showComparisonPrice: boolean
  directToCheckout: boolean
  selectedProducts: SelectedProduct[]
}
