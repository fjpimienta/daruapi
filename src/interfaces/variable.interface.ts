import { IPaginationOptions } from './pagination-options.interface';
import { IUser } from './user.interface';
import { ICatalog } from './catalog.interface';
import { IProduct, ISupplierProd } from './product.interface';
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
import { IGroupCva, IOrderCva } from './suppliers/_CvasShippments.interface';
import { IProductCvaShippment } from './suppliers/_CvasShippments.interface';
import { ICaptureChargeOpenpay, ICardOpenpay, IChargeOpenpay, ICustomerOpenpay, IPayoutOpenpay, IRefundChargeOpenpay } from './suppliers/_Openpay.interface';
import { IWelcome } from './welcome.interface';
import { ICupon } from './cupon.interface';
import { IIcommktContact } from './suppliers/_Icommkt.interface';
import { IOrderIngram } from './suppliers/_Ingram.interface';
import { IOrderSyscom } from './suppliers/_Syscom.interface';

export interface IVariables {
  id?: string | number;
  active?: string;
  filterName?: string;
  offer?: boolean;
  filterBranch?: string;
  slug?: string;
  pagination?: IPaginationOptions;
  user?: IUser;
  admin?: boolean;
  brand?: ICatalog;
  brands?: ICatalog[];
  model?: ICatalog;
  categorie?: ICatalog;
  categories?: ICatalog[];
  subCategories?: ICatalog[];
  subcategorie?: ICatalog;
  tag?: ICatalog;
  group?: ICatalog;
  groups?: ICatalog[];
  product?: IProduct;
  products?: IProduct[];
  shopProduct?: IShopProduct;
  supplier?: ISupplier;
  suppliers?: ISupplier[];
  supplierId?: string;
  weekNumber?: number;
  apiproveedor?: IApiproveedor;
  c_pais?: string;
  country?: ICountry;
  countrys?: ICountry[];
  order?: IOrder;
  orders?: IOrder[];
  config?: IConfig;
  welcome?: IWelcome;
  welcomes?: IWelcome[];
  warehouse?: IWarehouse;
  warehouses?: IWarehouse[];
  shipping?: IShipping;
  shippings?: IShipping[];
  orderCt?: IOrderCt;
  ordersCt?: IOrderCt[];
  orderCva?: IOrderCva;
  ordersCva?: IOrderCva[];
  orderIngram?: IOrderIngram;
  orderIngrams?: IOrderIngram[];
  name?: string;
  typeApi?: string;
  nameApi?: string;
  delivery?: IDelivery;
  deliveryId?: string;
  deliverys?: IDelivery[];
  role?: string;
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
  producto?: IProductoCt;
  cfdi?: string;
  // Ct Status
  folio?: string;
  // Ct Volumen
  codigo?: string;
  existenciaProducto?: ISupplierProd;
  // Cva Shipping
  paqueteria?: number;
  cp?: number;
  cp_sucursal?: string;
  productosCva?: IProductCvaShippment[];
  // CVa Pedido Detalle
  pedido?: string;
  // CVa  Pedido Alta
  pedidoCva?: IOrderCva;
  // CVA Grupos
  gruposCva?: IGroupCva;
  // CVA Precios
  brandName?: string;
  groupName?: string;
  codigoCva?: string;
  // Openpay
  idCardOpenpay?: string;
  cardOpenpay?: ICardOpenpay;
  idCustomerOpenpay?: string;
  customerOpenpay?: ICustomerOpenpay;
  idChargeOpenpay?: string;
  chargeOpenpay?: IChargeOpenpay;
  idTransactionOpenpay?: string;
  captureTransactionOpenpay?: ICaptureChargeOpenpay;
  refundTransactionCharge?: IRefundChargeOpenpay;
  payoutOpenpay?: IPayoutOpenpay;
  idPayoutOpenpay?: string;
  cupon?: ICupon;
  cupons?: ICupon[];
  email?: String;
  //icecat
  brandIcecat?: string;
  productIcecat?: string;
  upcIcecat?: string;
  // ingram
  ingramPartNumber?: string;
  vendorPartNumber?: string;
  upc?: string;
  allRecords?: Boolean;
  imSKU?: string;
  idOrderIngram?: string;
  pedidoIngram?: IOrderIngram;
  // products
  partNumber?: string;
  // icommkt
  icommkContactInput?: IIcommktContact;
  icommkContactInputs?: [IIcommktContact];
  // searchs
  year?: number;
  month?: string;
  // syscom
  paisName?: string;
  coloniaName?: string;
  sucursalName?: string;
  categoryId?: string;
  productId?: string;
  facturaId?: string;
  orderSyscomInput?: IOrderSyscom;
  // daisytek
  partNumberDaisytek?: string;
}