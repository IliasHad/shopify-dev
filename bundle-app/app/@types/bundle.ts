export interface ShopifyVariant {
    id: string;
    title: string;
    price: string;
  }
  
  export interface ShopifyProduct {
    id: string;
    title: string;
    variants: ShopifyVariant[];
    images: { originalSrc: string }[];
  }
  
  export interface ProductVariant {
    id: string;
    title: string;
    quantity: number;
    price: number;
    originalPrice: number;
  }
  
  export interface SelectedProduct {
    title: string;
    id: string;
    variants: ProductVariant[];
    quantity: number;
    featuredImage: string;
    offer: number;
  }
  