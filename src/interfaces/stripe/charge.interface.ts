export interface IStripeCharge {
   id: string;
   amount: number;
   status: string;
   receipt_email: string;
   receipt_url: string;
   paid: boolean;
   payment_method: string;
   created: String;
   description: string;
   customer: string;
}