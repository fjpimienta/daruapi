export interface IProduct {
  id?: string;
  name?: string;
  slug?: string;
  price: number;
  sale_price: number;
  exchangeRate: number;
  review: number;
  ratings: number;
  until: string;
  stock: number;
  top: boolean;
  featured: boolean;
  new: boolean;
  author: string;
  sold: string;
  short_desc?: string;
  partnumber: string;
  sku: string;
  upc: string;
  ean: string;
  category: ICategorys[];
  subCategory: ICategorys[];
  brand: string;
  brands: IBrands[];
  model: string;
  peso: number;
  pictures?: IPicture[];
  sm_pictures?: IPicture[];
  variants: IVariant[];
  unidadDeMedida?: IUnidadDeMedida;
  active: boolean;
  suppliersProd: ISupplierProd;
  descuentos: IDescuentos;
  promociones: IPromociones;
  registerDate?: String;
  sheetJson?: String;
  especificaciones: IEspecificacion[];
  especificacionesBullet: IEspecificacionBullet[];
}

export interface IEspecificacion {
  agrupadoPor: String;
  tipo: String;
  valor: String;
}

export interface IEspecificacionBullet {
  tipo: String;
  valor: String[];
}

export interface ICategorys {
  name: string;
  slug: string;
  pivot: IPivotCategory;
}

export interface IPivotCategory {
  product_id: string;
  product_category_id: string;
}

export interface IBrands {
  name: string;
  slug: string;
}

export interface IPicture {
  width: string;
  height: string;
  url: string;
}

export interface IVariant {
  id: number;
  color: string;
  color_name: string;
  price: number;
  pivot: IPivoteVariant;
  size: ISize;
}

export interface IPivoteVariant {
  product_id: string;
  component_id: string;
}

export interface ISize {
  id: number;
  name: string;
  slug: string;
  pivot: IPivoteSize;
}

export interface IPivoteSize {
  components_variants_variant_id: string;
  component_id: string;
}

export interface IUnidadDeMedida {
  id: string;
  name: string;
  slug: string;
}

export interface ISupplierProd {
  idProveedor: string;
  codigo: string;
  price: number;
  cantidad: number;
  sale_price: number;
  moneda: string;
  branchOffices: IBranchOffices[];
  category: ICategorys
  subCategory: ICategorys
}

export interface IBranchOffices {
  id: string;
  name: string;
  estado: string;
  cantidad: number;
  cp: string;
  latitud: string;
  longitud: string;
}

export interface IDescuentos {
  total_descuento: number;
  moneda_descuento: string;
  precio_descuento: number;
}

export interface IPromociones {
  clave_promocion: string;
  descripcion_promocion: string;
  inicio_promocion: string;
  vencimiento_promocion: string;
  disponible_en_promocion: number;
  porciento: number;
}


export interface IPaginationData {
  page: number;
  itemsPage: number;
  total: number;
  pages: number;
}

export interface IProductResponse {
  info: IPaginationData | null;
  status: boolean;
  message: string;
  products: any[];
}