import { ICupon } from './cupon.interface';
import { IInvoiceConfig } from './invoiceConfig.interface';
import { IOrderCt } from './suppliers/_CtsShippments.interface';
import { IOrderCva } from './suppliers/_CvasShippments.interface';
import { IOrderCtConfirmResponse, IOrderCtResponse } from './suppliers/orderctresponse.interface';
import { IOrderCvaResponse } from './suppliers/ordercvaresponse.interface';
import { IUser } from './user.interface';
import { IWarehouse } from './warehouses.interface';

export interface IDelivery {
  id: string;
  deliveryId: string;
  cliente: string;
  cupon?: ICupon;
  discount: number;
  importe: number;
  registerDate?: string;
  user: IUser;
  warehouses: IWarehouse[];
  ordersCt?: IOrderCt[];
  ordersCva?: IOrderCva[];
  orderCtResponse?: IOrderCtResponse;
  orderCtConfirmResponse?: IOrderCtConfirmResponse;
  orderCvaResponse?: IOrderCvaResponse;
  invoiceConfig?: IInvoiceConfig;
  statusError: boolean;
  messageError: string;
}
