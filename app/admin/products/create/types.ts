export interface Attribute {
  id: string;
  name: string;
  values: string[];
  visible: boolean;
  variation: boolean;
}

export interface Variation {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}