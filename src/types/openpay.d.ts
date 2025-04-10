declare module 'openpay' {
  interface OpenPayOptions {
    merchantId: string;
    privateKey: string;
    isProductionReady?: boolean;
  }

  interface Customer {
    name: string;
    email: string;
    [key: string]: any;
  }

  interface Card {
    card_number: string;
    holder_name: string;
    expiration_year: string;
    expiration_month: string;
    cvv2?: string;
    [key: string]: any;
  }

  interface Charge {
    source_id: string;
    method: string;
    amount: number;
    currency: string;
    description: string;
    device_session_id?: string;
    customer?: Customer;
    [key: string]: any;
  }

  interface OpenPayInstance {
    customers: {
      create(customer: Customer, callback: (error: Error | null, response: any) => void): void;
      update(customerId: string, customerData: Partial<Customer>, callback: (error: Error | null, response: any) => void): void;
      delete(customerId: string, callback: (error: Error | null, response: any) => void): void;
      get(customerId: string, callback: (error: Error | null, response: any) => void): void;
      list(searchParams: any, callback: (error: Error | null, response: any) => void): void;
    };
    cards: {
      create(customerId: string, card: Card, callback: (error: Error | null, response: any) => void): void;
      get(customerId: string, cardId: string, callback: (error: Error | null, response: any) => void): void;
      list(customerId: string, callback: (error: Error | null, response: any) => void): void;
      delete(customerId: string, cardId: string, callback: (error: Error | null, response: any) => void): void;
    };
    charges: {
      create(charge: Charge, callback: (error: Error | null, response: any) => void): void;
      get(transactionId: string, callback: (error: Error | null, response: any) => void): void;
      list(searchParams: any, callback: (error: Error | null, response: any) => void): void;
      refund(transactionId: string, refundData: any, callback: (error: Error | null, response: any) => void): void;
    };
    [key: string]: any;
  }

  function OpenPay(merchantId: string, privateKey: string, isProduction?: boolean): OpenPayInstance;
  
  export = OpenPay;
}
