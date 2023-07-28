export interface ICardOpenpay {
  card_number: string;
  holder_name: string;
  expiration_year: string;
  expiration_month: string;
  cvv2: string;
}

export interface ICustomerOpenpay {
  external_id: string;
  name: string;
  last_name: string;
  email: string;
  phone_number: string;
  requires_account: boolean;
  clabe: string;
  address: IAddressOpenpay;
}

export interface IAddressOpenpay {
  line1: string;
  line2: string;
  line3: string;
  postal_code: string;
  state: string;
  city: string;
  country_code: string;
}
