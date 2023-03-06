export interface IStripeCard {
   id?: string;
   customer: string;
   brand: string;
   country: string;
   number: string;
   expMonth: number;
   expYear: number;
   cvc: string;
}
