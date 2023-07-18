import { IPaginationOptions } from './pagination-options.interface';
import { IUser } from './user.interface';
import { ICatalog } from './catalog.interface';
import { IProduct } from './product.interface';
import { IApiproveedor } from './apiproveedor.interface';
import { ISupplier } from './suppliers/supplier.interface';
import { ICountry } from './country.interface';
import { IOrder } from './order.interface';
import { IShopProduct } from './shop-product.interface';
import { IConfig } from './config.interface';
import { IWarehouse } from './warehouses.interface';
import { IShipping } from './shipping.interface';
import { IEnvioCt, IGuiaConnect, IOrderCt, IProductoCt } from './suppliers/_CtsShippments.interface';
import { IDelivery } from './delivery.interface';
import { IProductCtShippment } from './suppliers/_CtsShippments.interface';
import { IOrderCva } from './suppliers/order-cva.interface';
import { IProductCvaShippment } from './suppliers/_CvasShippments.interface';

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
  delivery?: IDelivery;
  deliverys?: IDelivery[];
  // 99minutos Token
  origin?: string;
  destination?: string;
  deliveryType?: string;
  // 99minutos Shipping Rate
  size?: string;
  originZipcode?: string;
  originCountry?: string;
  destinationZipcode?: string;
  destinationCountry?: string;
  // Ct Shipping
  destinoCt?: string;
  productosCt?: IProductCtShippment[];
  // Ct Order
  idPedido?: number;
  almacen?: string;
  tipoPago?: string;
  guiaConnect?: IGuiaConnect;
  envio?: IEnvioCt;
  productoCt?: IProductoCt;
  cfdi?: string;
  // Cva Shipping
  paqueteria?: number;
  cp?: number;
  cp_sucursal?: number;
  productosCva?: IProductCvaShippment[];
}