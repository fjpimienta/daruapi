import { IOrderCt } from './suppliers/order-ct.interface';
import { IOrderCva } from './suppliers/order-cva.interface';
import { IOrderCtResponse } from './suppliers/orderctresponse.interface';
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
  orderCvaResponse?: IOrderCvaResponse;
  statusError: boolean;
  messageError: string;
}
