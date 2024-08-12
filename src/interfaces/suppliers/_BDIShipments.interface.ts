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

export interface IOrderIngramInput {
  orderNumberClient: string;
  company: string;
  note: string;
  nameClient: string;
  street: string;
  colony: string;
  phoneNumber: string;
  city: string;
  state: string;
  cp: string;
  email: string;
  branch: string;
  products: IProductOrderIngram[];
  carrier: string;
}

export interface IProductOrderIngram {
  sku: string;
  qty: number;
}