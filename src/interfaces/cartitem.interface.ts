import { IProduct } from './product.interface';

export interface ICartItem extends IProduct {
  qty: number;
	sum: number;
}


