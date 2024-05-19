
// Lista de Precios
export interface IProductDaisytek {
  sku: string;
  manufacturer_sku: string;
  manufacturer: string;
  ean: string;
  title: string;
  description: string;
  currency: string;
  price: number;
  warehouses: IWarehousesDaisytek
}

export interface IWarehousesDaisytek {
  CDMX?: IWarehouseDaisytek;
  VHM?: IWarehouseDaisytek;
  MTY?: IWarehouseDaisytek;
  GDL?: IWarehouseDaisytek;
  SUR?: IWarehouseDaisytek;
  [key: string]: IWarehouseDaisytek | undefined;
}

export interface IWarehouseDaisytek {
  stock: number;
  id: string;
  location: string;
}

export interface IOrderDaisytek {
  purchase_order_number: string;
  warehouse: string;
  products: IProductoDaisytekInput[]
}

export interface IProductoDaisytekInput {
  sku: string;
  quantity: number;
}
