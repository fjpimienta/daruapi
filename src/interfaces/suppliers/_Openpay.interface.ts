//#region "card"
export interface ICardOpenpay {
  card_number: string;
  holder_name: string;
  expiration_year: string;
  expiration_month: string;
  cvv2: string;
}
//#endregion

//#region "Customers"
export interface ICustomerOpenpay {
  external_id: string;
  name: string;
  last_name: string;
  email: string;
  phone_number: string;
  requires_account: boolean;
  clabe: string;
  bank_name: string;
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
//#region 

//#region "Charges"
export interface IChargeOpenpay {
  id: string;
  method: string;
  source_id: string;
  amount: number;
  currency?: string;
  description: string;
  order_id?: string;
  device_session_id: string;
  capture?: boolean;
  customer: ICustomerOpenpay;
  payment_plan?: IPaymentPlanOpenpay;
  payment_method?: IPaymentMethodOpenpay;
  // metadata?: MetadataField[];
  use_card_points?: 'ONLY_POINTS' | 'MIXED' | 'NONE';
  send_email?: boolean;
  redirect_url?: string;
  use_3d_secure?: boolean;
  status?: string;
}

export interface IBankAccountOpenpay {
  clabe: string;
  holder_name: string;
  alias: string;
  bank_name: string;
}

export interface IPaymentPlanOpenpay {
  payments: number;
}

export interface IPaymentMethodOpenpay {
  type?: string;
  url?: string;
  agreement?: string;
  bank?: string;
  clabe?: string;
  name?: string;
}

export interface ICaptureChargeOpenpay {
  amount: number;
}

export interface IRefundChargeOpenpay {
  amount: number;
  description: string;
}

export interface IPayoutOpenpay {
  method: string;
  bank_account: IBankAccountOpenpay;
  amount: number;
  description: string;
  order_id: string;
}
//#endregion