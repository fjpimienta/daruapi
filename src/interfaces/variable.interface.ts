import { IPaginationOptions } from './pagination-options.interface';
import { IUser } from './user.interface';
import { ICatalog } from './catalog.interface';
import { IProduct } from './product.interface';
import { IApiproveedor } from './apiproveedor.interface';
import { IApisupplier, ISupplier } from './suppliers/supplier.interface';
import { ICountry } from './country.interface';
import { IOrder } from './order.interface';
import { IShopProduct } from './shop-product.interface';
import { IConfig } from './config.interface';
import { IWarehouse } from './warehouses.interface';
import { IApiShip, IShipping } from './shipping.interface';
import { IOrderCt } from './suppliers/order-ct.interface';
import { IOrderCva } from './suppliers/order-cva.interface';

export interface IVariables {
  id?: string | number;
  active?: string;
  filterName?: string;
  offer?: boolean;
  filterBranch?: string;
  slug?: string;
  pagination?: IPaginationOptions;
  user?: IUser;
  brand?: ICatalog;
  brands?: ICatalog[];
  model?: ICatalog;
  categorie?: ICatalog;
  categories?: ICatalog[];
  subcategorie?: ICatalog;
  tag?: ICatalog;
  group?: ICatalog;
  groups?: ICatalog[];
  product?: IProduct;
  products?: IProduct[];
  shopProduct?: IShopProduct;
  supplier?: ISupplier;
  suppliers?: ISupplier[];
  apiproveedor?: IApiproveedor;
  c_pais?: string;
  country?: ICountry;
  countrys?: ICountry[];
  order?: IOrder;
  orders?: IOrder[];
  config?: IConfig;
  warehouse?: IWarehouse;
  warehouses?: IWarehouse[];
  shipping?: IShipping;
  shippings?: IShipping[];
  orderCt?: IOrderCt;
  ordersCt?: IOrderCt[];
  orderCva?: IOrderCva;
  ordersCva?: IOrderCva[];
  name?: string;
  typeApi?: string;
  nameApi?: string;
  // apiSupplier?: IApisupplier;
  // supplierName?: ISupplier;
}