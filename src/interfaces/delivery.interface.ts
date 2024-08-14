import { ICupon } from './cupon.interface';
import { IInvoiceConfig } from './invoiceConfig.interface';
import { IOrderIngram } from './suppliers/_BDIShipments.interface';
import { IOrderCt } from './suppliers/_CtsShippments.interface';
import { IOrderCva } from './suppliers/_CvasShippments.interface';
import { IChargeOpenpay } from './suppliers/_Openpay.interface';
import { IOrderSyscom } from './suppliers/_Syscom.interface';
import { IUserBasic } from './user.interface';
import { IWarehouse } from './warehouses.interface';

export interface IDelivery {
  id?: string;
  deliveryId?: string;
  cliente?: string;
  cupon?: ICupon;
  discount?: number;
  importe?: number;
  registerDate?: string;
  lastUpdate?: String
  user: IUserBasic;
  chargeOpenpay: IChargeOpenpay
  warehouses: IWarehouse[];
  ordersCt?: IOrderCt[];
  ordersCva?: IOrderCva[];
  ordersSyscom?: IOrderSyscom[];
  ordersIngram?: IOrderIngram[];
  invoiceConfig?: IInvoiceConfig;
  statusError?: boolean;
  messageError?: string;
  status?: string;
}
