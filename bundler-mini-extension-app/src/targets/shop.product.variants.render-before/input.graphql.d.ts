import { DocumentNode } from "graphql-typed";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
export namespace ProductVariantsRenderBeforeQueryPartialData {
  export interface ProductBundledComponentData {
    __typename?: "Metafield" | null;
    value?: string | null;
  }
  export interface Product {
    __typename?: "Product" | null;
    id?: string | null;
    title?: string | null;
    bundledComponentData?: ProductVariantsRenderBeforeQueryPartialData.ProductBundledComponentData | null;
  }
  export interface Shop {
    __typename?: "Shop" | null;
    id?: string | null;
  }
}
export interface ProductVariantsRenderBeforeQueryPartialData {
  product?: ProductVariantsRenderBeforeQueryPartialData.Product | null;
  shop?: ProductVariantsRenderBeforeQueryPartialData.Shop | null;
}
export namespace ProductVariantsRenderBeforeQueryData {
  export interface ProductBundledComponentData {
    __typename: "Metafield";
    value: string;
  }
  export interface Product {
    __typename: "Product";
    id: string;
    title: string;
    bundledComponentData?: ProductVariantsRenderBeforeQueryData.ProductBundledComponentData | null;
  }
  export interface Shop {
    __typename: "Shop";
    id: string;
  }
}
export interface ProductVariantsRenderBeforeQueryData {
  product?: ProductVariantsRenderBeforeQueryData.Product | null;
  shop?: ProductVariantsRenderBeforeQueryData.Shop | null;
}
declare const document: DocumentNode<ProductVariantsRenderBeforeQueryData, never, ProductVariantsRenderBeforeQueryPartialData> & TypedDocumentNode<ProductVariantsRenderBeforeQueryData, {
  [key: string]: never;
}>;
export default document;