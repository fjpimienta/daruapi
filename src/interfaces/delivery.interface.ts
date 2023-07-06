import { IOrderCt } from './suppliers/order-ct.interface';
import { IOrderCva } from './suppliers/order-cva.interface';
import { IOrderCtConfirmResponse, IOrderCtResponse } from './suppliers/orderctresponse.interface';
import { IOrderCvaResponse } from './suppliers/ordercvaresponse.interface';
import { IUser } from './user.interface';
import { IWarehouse } from './warehouses.interface';

export interface IDelivery {
  id: string;
  deliveryId: string;
  registerDate?: string;
  user: IUser;
  warehouses: IWarehouse[];
  ordersCt?: IOrderCt[];
  ordersCva?: IOrderCva[];
  orderCtResponse?: IOrderCtResponse;
  orderCtConfirmResponse?: IOrderCtConfirmResponse;
  orderCvaResponse?: IOrderCvaResponse;
  statusError: boolean;
  messageError: string;
}
