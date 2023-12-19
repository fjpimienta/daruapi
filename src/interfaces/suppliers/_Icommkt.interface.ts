export interface ListContactsFullJsonResult {
  ListContactsFullJsonResult: Contact[];
}

export interface Contact {
  Email: string;
  Status: string;
  CustomFields: CustomField[];
}

export interface CustomField {
  Key: string;
  Value: string;
}
