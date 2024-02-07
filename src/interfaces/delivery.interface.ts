import { ICupon } from './cupon.interface';
import { IInvoiceConfig } from './invoiceConfig.interface';
import { IOrderCt } from './suppliers/_CtsShippments.interface';
import { IOrderCva } from './suppliers/_CvasShippments.interface';
import { IChargeOpenpay } from './suppliers/_Openpay.interface';
import { IOrderCtConfirmResponse, IOrderCtResponse } from './suppliers/orderctresponse.interface';
import { IOrderCvaResponse } from './suppliers/ordercvaresponse.interface';
import { IUserBasic } from './user.interface';
import { IWarehouse } from './warehouses.interface';

export interface IDelivery {
  id: string;
  deliveryId: string;
  cliente: string;
  cupon?: ICupon;
  discount: number;
  importe: number;
  registerDate?: string;
  lastUpdate: String
  user: IUserBasic;
  chargeOpenpay: IChargeOpenpay
  warehouses: IWarehouse[];
  ordersCt?: IOrderCt[];
  ordersCva?: IOrderCva[];
  invoiceConfig?: IInvoiceConfig;
  statusError: boolean;
  messageError: string;
  status?: string;
}
