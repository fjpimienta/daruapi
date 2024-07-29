import { IProduct } from '../interfaces/product.interface';

export class Product implements IProduct {
  id?: string = '0';
  name?: string = '';
  slug?: string = '';
  price: number = 0;
  sale_price: number = 0;
  exchangeRate: number = 0;
  review: number = 0;
  ratings: number = 0;
  until: string = '';
  stock: number = 0;
  top: boolean = false;
  featured: boolean = false;
  new: boolean = false;
  author: string = '';
  sold: string = '';
  short_desc?: string = '';
  partnumber: string = '';
  sku: string = '';
  upc: string = '';
  ean: string = '';
  category: Categorys[] = [];
  subCategory: Categorys[] = [];
  brand: string = '';
  brands: Brands[] = [];
  model: string = '';
  peso: number = 0;
  pictures: Picture[] = [];
  sm_pictures: Picture[] = [];
  variants: Variant[] = [];
  unidadDeMedida: UnidadDeMedida = { id: '', name: '', slug: '' };
  active: boolean = false;
  suppliersProd: SupplierProd = { idProveedor: '', codigo: '', price: 0, cantidad: 0, sale_price: 0, moneda: '', branchOffices: [], category: { name: '', slug: '', pivot: { product_id: '', product_category_id: '' } }, subCategory: { name: '', slug: '', pivot: { product_id: '', product_category_id: '' } } };
  descuentos: Descuentos = { total_descuento: 0, moneda_descuento: '', precio_descuento: 0 };
  promociones: Promociones = { clave_promocion: '', descripcion_promocion: '', inicio_promocion: '', vencimiento_promocion: '', disponible_en_promocion: 0, porciento: 0, };
  registerDate?: string = '';
  sheetJson: string = '';
  especificaciones: Especificacion[] = [];
  especificacionesBullet: EspecificacionBullet[] = [];
}

export class Especificacion {
  tipo: string = '';
  valor: string = '';
}

export class EspecificacionBullet {
  tipo: string = '';
  valor: string[] = [];
}

export class Categorys {
  name: string = '';
  slug: string = '';
  pivot: PivotCategory = { product_id: '', product_category_id: '' };
}

export class PivotCategory {
  product_id: string = '';
  product_category_id: string = '';
}

export class Brands {
  name: string = '';
  slug: string = '';
  pivot: PivotBrand = { product_id: '', brand_id: '' };
}

export class PivotBrand {
  product_id: string = '';
  brand_id: string = '';
}

export class Picture {
  width: string = '';
  height: string = '';
  url: string = '';
  pivot: PivotePicture = { related_id: '', upload_file_id: '' };
}

export class PivotePicture {
  related_id: string = '';
  upload_file_id: string = '';
}

export class Variant {
  id: number = 0;
  color: string = '';
  color_name: string = '';
  price: number = 0;
  pivot: PivoteVariant = { product_id: '', component_id: '' };
  size: Size = { id: 0, name: '', slug: '', pivot: { components_variants_variant_id: '', component_id: '' } };
}

export class PivoteVariant {
  product_id: string = '';
  component_id: string = '';
}

export class Size {
  id: number = 0;
  name: string = '';
  slug: string = '';
  pivot: PivoteSize = { components_variants_variant_id: '', component_id: '' };
}

export class PivoteSize {
  components_variants_variant_id: string = '';
  component_id: string = '';
}

export class UnidadDeMedida {
  id: string = '';
  name: string = '';
  slug: string = '';
}

export class SupplierProd {
  idProveedor: string = '';
  codigo: string = '';
  price: number = 0;
  cantidad: number = 0;
  sale_price: number = 0;
  moneda: string = '';
  branchOffices: BranchOffices[] = [];
  category: Categorys = { name: '', slug: '', pivot: { product_id: '', product_category_id: '' } };
  subCategory: Categorys = { name: '', slug: '', pivot: { product_id: '', product_category_id: '' } };
}

export class BranchOffices {
  id: string = '';
  name: string = '';
  estado: string = '';
  cantidad: number = 0;
  cp: string = '';
  latitud: string = '';
  longitud: string = '';
  promocionBranchOffice: PromocionBranchOffice = { price: 0, porciento: 0, vigente: { ini: '', fin: '' } };
}

export class PromocionBranchOffice {
  price: number = 0;
  porciento: number = 0;
  vigente: Vigente = { ini: '', fin: '' };
}

export class Vigente {
  ini: string = '';
  fin: string = '';
}

export class Descuentos {
  total_descuento: number = 0;
  moneda_descuento: string = '';
  precio_descuento: number = 0;
}

export class Promociones {
  clave_promocion: string = '';
  descripcion_promocion: string = '';
  inicio_promocion: string = '';
  vencimiento_promocion: string = '';
  disponible_en_promocion: number = 0;
  porciento: number = 0;
}


export class ProductExportInterno {
  ID: number = 0;
  CON_DESCUENTO: boolean = false;
  NOMBRE_DEL_PRODUCTO: string = '';
  PRECIO_VENTA: number = 0;
  PRECIO_VENTA_DESCUENTO: number = 0;
  PRECIO_COMPRA: number = 0;
  PRECIO_COMPRA_DESCUENTO: number = 0;
  MARCA: string = '';
  TIPO_DE_CAMBIO: number = 0;
  EXISTENCIA: number = 0;
  SKU: string = '';
  PROVEEDOR: string = '';
}
