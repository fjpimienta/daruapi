export interface IWarehouse {
  id: string;
  homoclave: string;
  active: boolean;
  almacen: string;
  cp: string;
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  telefono: string;
  numero: string;
  suppliersCat: ISupplierCat[];
}

export interface ISupplierCat {
  idProveedor: string;
  name: string;
  slug: string;
}
