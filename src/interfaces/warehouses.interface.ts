import { ICartItem } from './cartitem.interface';
import { IProduct, ISupplierProd } from './product.interface';
import { IProductShipment } from './productShipment.interface';
import { IShipment } from './shippment.interface';

export interface IWarehouse {
  id: string;
  cp: string;
  name: string;
  estado: string;
  latitud: string;
  longitud: string;
  suppliersProd: ISupplierProd;
  products: ICartItem[];
  productShipments: IProductShipment[];
  shipments: IShipment[];
}
