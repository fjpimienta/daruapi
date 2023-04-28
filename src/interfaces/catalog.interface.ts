export interface ICatalog {
  id?: string;
  description?: string;
  slug: string;
  order: number;
  active: boolean;
  suppliersCat: ISupplierCat[];
}

export interface ISupplierCat {
  idProveedor: string;
  name: string;
  slug: string;
}
