export interface IApiproveedor {
  id?: number;
  name?: string;
  slug?: string;
  uri_base?: string;
  token?: IToken;
  catalogos: ICatalogos[];
}

export interface IToken {
  verbo: string;
  uri: string;
  body: IBody;
  requiere_token: boolean;
  tipo_token: string;
}

export interface IBody {
  client_id: string;
  client_secret: string;
  grant_type: string;
}

export interface ICatalogos {
  name: string;
  uri: string;
  headers: IHeader;
}

export interface IHeader {
  authorization: string;
}

export interface IPicture {
  width: string;
  height: string;
  url: string;
  pivot: IPivotePicture;
}

export interface IPivotePicture {
  related_id: string;
  upload_file_id: string;
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