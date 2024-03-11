export interface IProductIndicator {
  hasWarranty: boolean;
  isNewProduct: boolean;
  hasReturnLimits: boolean;
  isBackOrderAllowed: boolean;
  isShippedFromPartner: boolean;
  isReplacementProduct: boolean;
  replacementType: string;
  isDirectship: boolean;
  isDownloadable: boolean;
  isDigitalType: boolean;
  skuType: string;
  hasStdSpecialPrice: boolean;
  hasAcopSpecialPrice: boolean;
  hasAcopQuantityBreak: boolean;
  hasStdWebDiscount: boolean;
  hasAcopWebDiscount: boolean;
  hasSpecialBid: boolean;
  isExportableToCountry: boolean;
  isDiscontinuedProduct: boolean;
  isRefurbished: boolean;
  isReturnableProduct: boolean;
  isIngramShip: boolean;
  isEnduserRequired: boolean;
  isHeavyWeight: boolean;
  hasLtl: boolean;
  isClearanceProduct: boolean;
  hasBundle: boolean;
  isOversizeProduct: boolean;
  isPreorderProduct: boolean;
  isLicenseProduct: boolean;
  isDirectshipOrderable: boolean;
  isServiceSku: boolean;
  isConfigurable: boolean;
}

export interface ICiscoFields {
  productSubGroup: string;
  serviceProgramName: string;
  itemCatalogCategory: string;
  configurationIndicator: string;
  internalBusinessEntity: string;
  itemType: string;
  globalListPrice: string;
}

export interface ITechnicalSpecification {
  headerName: string;
  attributeName: string;
  attributeDisplay: string;
  attributeValue: string;
}

export interface IProductWeight {
  plantId: string;
  weight: number;
  weightUnit: string;
}

export interface IAdditionalInformation {
  productWeight: IProductWeight[];
  isBulkFreight: boolean;
  height: string;
  width: string;
  length: string;
  netWeight: string;
  dimensionUnit: string;
}

export interface IIngramProduct {
  ingramPartNumber: string;
  vendorPartNumber: string;
  category: String
  subCategory: String
  upc: string;
  customerPartNumber: string;
  productAuthorized: string;
  description: string;
  productDetailDescription: string;
  productCategory: string;
  productSubCategory: string;
  vendorName: string;
  vendorNumber: string;
  productStatusCode: string;
  productClass: string;
  indicators: IProductIndicator;
  ciscoFields: ICiscoFields;
  technicalSpecifications: ITechnicalSpecification[];
  warrantyInformation: string[];
  additionalInformation: IAdditionalInformation;
}

// QueryVariable
export interface IProductsQuery {
  ingramPartNumber: string;
}

// export interface IProductsQuery {
//   ingramsPartNumber: IProductQuery[];
// }

// Precios
export interface IPricesIngram {
  productStatusMessage: string;
  ingramPartNumber: string;
  vendorPartNumber: string;
  extendedVendorPartNumber: string;
  upc: string;
  vendorNumber: string;
  vendorName: string;
  description: string;
  category: string;
  subCategory: string;
  newProduct: boolean;
  productClass: string;
  uom: string;
  acceptBackOrder: boolean;
  productAuthorized: boolean;
  returnableProduct: boolean;
  endUserInfoRequired: boolean;
  govtSpecialPriceAvailable: boolean;
  availability: {
    available: boolean;
    totalAvailability: number;
    availabilityByWarehouse: {
      warehouseId: number;
      location: string;
      quantityAvailable: number;
      quantityBackordered: number;
      backOrderInfo?: {
        quantity: number;
        etaDate: string;
      }[];
    }[];
  };
  pricing: {
    mapPrice: number;
    currencyCode: string;
    retailPrice: number;
    customerPrice: number;
  };
  discounts: {
    specialPricing: {
      specialPricingAvailableQuantity: number;
      specialPricingExpirationDate: string;
      specialBidNumber: string;
      specialPricingMinQuantity: number;
      specialPricingEffectiveDate: string;
      discountType: string;
      specialPricingDiscount: number;
      governmentDiscountType: string;
      governmentDiscountedCustomerPrice: number;
    }[];
    quantityDiscounts: {
      currencyType: string;
      amount: number;
      quantity: number;
      conditionType: string;
      currencyCode: string;
    }[];
  };
  bundlePartIndicator: string;
  serviceFees: {
    conditionType: string;
    description: string;
    amount: string;
    endDate: string;
    currencyCode: string;
  }[];
}

// Catalogo Price.txt
export interface ICatalogIngram {
  changeCode: string;
  imSKU: string;
  vendorNumber: string;
  vendorName: string;
  descriptionLine1: string;
  descriptionLine2: string;
  retailPriceMSRP: number;
  vendorPartNumber: string;
  weight: number;
  upcCode: string;
  length: number;
  width: number;
  height: number;
  customerCostChangeCode: string;
  customerCost: number;
  specialPricingChangeCode: string;
  stockAvailableYN: string;
  partStatus: string;
  allianceProduct: string;
  cpuCode: string;
  mediaCode: string;
  ingramCatSubcategory: number;
  yIfPartStockedAtIM: string;
  rebateAppliedToCostYN: string;
  substituteIMPartNumber: string;
}
