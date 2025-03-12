export interface IShipmentFedex {
  origin: IAddressFedex;
  destination: IAddressFedex;
  shipDate: string;
  packageDetails: IPackageFedex;
}

export interface IAddressFedex {
  streetLines: string[];
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string;
  residential: boolean;
}

export interface IPackageFedex {
  weight: number;
  dimensions: IDimensionsFedex;
}

export interface IDimensionsFedex {
  length: number;
  width: number;
  height: number;
}

export interface IFedExTransitTimeResponse {
  output: {
    transitTimes: ITransitTime[];
  };
}

export interface ITransitTime {
  transitTimeDetails: ITransitTimeDetail[];
}

export interface ITransitTimeDetail {
  serviceType: string;
  deliveryDate: string;
  transitTime: string;
  rate?: {
    amount: number;
    currency: string;
  };
}

export interface IFedExRequest {
  transactionId: string;
  customerTransactionId: string;
  requestedShipment: {
    shipper: {
      address: {
        streetLines: string[];
        city: string;
        stateOrProvinceCode: string;
        postalCode: string;
        countryCode: string;
      }
    };
    recipient: {
      address: {
        streetLines: string[];
        city: string;
        stateOrProvinceCode: string;
        postalCode: string;
        countryCode: string;
      }
    };
    shipDatestamp: string;
    requestedPackageLineItems: [{
      weight: {
        units: string;
        value: number;
      };
      dimensions: {
        length: number;
        width: number;
        height: number;
        units: string;
      }
    }]
  }
}

export interface IFedExService {
  serviceType: string;
  deliveryDate: string;
  transitTime: string;
  rate?: {
    amount: number;
    currency: string;
  };
}
