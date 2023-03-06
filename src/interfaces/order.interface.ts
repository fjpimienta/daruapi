import { IUser } from './user.interface';
import { IStripeCharge } from './stripe/charge.interface';
import { ICartItem } from './cartitem.interface';

export interface IOrder {
  id?: string;
  name?: string;
  registerDate?: string;
  user: IUser;
  charge?: IStripeCharge;
  cartitems: ICartItem[];
}


