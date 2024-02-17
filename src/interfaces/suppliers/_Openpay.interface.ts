export interface ICardOpenpay {
  id?: string;
  type?: string;
  card_number: string;
  holder_name: string;
  expiration_year: string;
  expiration_month: string;
  cvv2: string;
  allows_charges?: boolean;
  allows_payouts?: boolean;
  creation_date: string;
  bank_name?: string;
  customer_id?: string;
  bank_code?: string;
}

export interface ICustomerOpenpay {
  id: string;
  creation_date?: string;
  name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  bank_name?: string;
  external_id?: string;
  status?: string;
  balance?: string;
  address: IAddressOpenpay;
  store?: IStoreOpenpay;
  clabe: string;
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

export interface IStoreOpenpay {
  reference: string;
  barcode_url: string;
}

export interface IChargeOpenpay {
  id: string;
  authorization: string;
  transaction_type: string;
  operation_type: string;
  method: string;
  creation_date: string;
  operation_date: string;
  order_id: string;
  status: string;
  amount: number;
  description: string;
  error_message: string;
  customer_id: string;
  currency?: string;
  bank_account?: IBankAccountOpenpay;
  card?: ICardOpenpay;
  // card_points: CardPoints;
  payment_method?: IPaymentMethodOpenpay;
  conciliated: string;
  customer: ICustomerOpenpay;
  redirect_url?: string;
  device_session_id?: string;
  capture?: boolean;
  source_id?: string;
  payment_plan?: IPaymentPlanOpenpay;
  use_card_points?: 'ONLY_POINTS' | 'MIXED' | 'NONE';
  send_email?: boolean;
  use_3d_secure?: boolean;
  confirm?: boolean;
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

export interface IPayoutOpenpay {
  id: string;
  amount: string;
  authorization: string;
  method: string;
  operation_type: string;
  transaction_type: string;
  status: string;
  currency: string;
  creation_date: string;
  operation_date: string;
  description: string;
  error_message: string;
  order_id: string;
  bank_account: IBankAccountOpenpay;
  customer_id: string;
}

export interface IBankAccountOpenpay {
  clabe: string;
  holder_name: string;
  alias: string;
  bank_name: string;
}

export interface ICaptureChargeOpenpay {
  amount: number;
}

export interface IRefundChargeOpenpay {
  amount: number;
  description: string;
}
