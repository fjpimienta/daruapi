export interface ICountry {
  id?: string;
  c_pais?: string;
  d_pais?: string;
  estados: IEstado[];
}

export interface IEstado {
  c_estado: string;
  d_estado: string;
  municipios: IMunicipio[];
}

export interface IMunicipio {
  c_mnpio: string;
  D_mnpio: string;
}
