
// Lista de Precios
export interface IProductInttelec {
  sku: string;
  manufacturer_sku: string;
  manufacturer: string;
  ean: string;
  upc: string;
  asin: string;
  title: string;
  description: string;
  currency: string;
  price: IPriceInttelec[];
  warehouses: IWarehousesInttelec[];
}

export interface IPriceInttelec {
  price_unit: number;
}

export interface IWarehousesInttelec {
  location_id: IWarehouseInttelec[];
  available_quantity: number;
}

export interface IWarehouseInttelec {
  id: string;
  stock: number;
  location: string;
}

export interface IOrderInttelec {
  purchase_order_number: string;
  warehouse: string;
  products: IProductoInttelecInput[]
}

export interface IProductoInttelecInput {
  sku: string;
  quantity: number;
}