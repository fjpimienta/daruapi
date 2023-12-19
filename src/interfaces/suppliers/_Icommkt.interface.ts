export interface IIcommktContact {
  Email: string;
  CustomFields: CustomField[];
}

export interface CustomField {
  Key: string;
  Value: string;
}
