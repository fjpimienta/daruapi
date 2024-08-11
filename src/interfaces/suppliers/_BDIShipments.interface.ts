export interface IShippingBDIInput {
  street: string;
  colony: string;
  phoneNumber: string;
  city: string;
  state: string;
  cp: string;
  products: IProductShipmentIngram[];
}

export interface IProductShipmentIngram {
  sku: string;
  qty: number;
  branch: string;
  carrier: string;
}