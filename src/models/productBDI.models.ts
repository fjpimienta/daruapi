export class IProductBDI {
  active: string = '';
  sku: string = '';
  price: number = 0.0;
  inventory: number = 0;
  priceApply: number = 0.0;
  currencyCode: string = '';
  updatedAt: string = '';
  products: IProductDetailsBDI = {
    description: '',
    productDetailDescription: '',
    vendornumber: '',
    upcnumber: '',
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
    dimensionUnit: '',
    weightUnit: '',
    images: '',
    categoriesIdIngram: '',
    manufacturerIdIngram: '',
    listPrimaryAttribute: [''],
    manufacturerIngram: { id: 0, name: '' },
    categoriesIngram: { id: 0, nameTemp: '', parent: { id: 0, name: '' } },
    sheet: '',
    sheetJson: '',
    technicalSpecifications: [{
      headerName: '',
      attributeName: '',
      attributeDisplay: '',
      attributeValue: ''
    }]
  };
}

export class IProductDetailsBDI {
  description: string = '';
  productDetailDescription: string = '';
  vendornumber: string = '';
  upcnumber: string = '';
  weight: number = 0;
  height: number = 0;
  width: number = 0;
  length: number = 0;
  dimensionUnit: string = '';
  weightUnit: string = '';
  images: string = '';
  categoriesIdIngram: string = '';
  manufacturerIdIngram: string = '';
  listPrimaryAttribute: string[] = [''];
  manufacturerIngram: IManufacturerBDI = { id: 0, name: '' };
  categoriesIngram: ICategoryBDI = { id: 0, nameTemp: '', parent: { id: 0, name: '' } };
  sheet: string = '';
  sheetJson: string = '';
  technicalSpecifications: ITechnicalSpecificationBDI[] = [{
    headerName: '',
    attributeName: '',
    attributeDisplay: '',
    attributeValue: ''
  }];
}

export class IManufacturerBDI {
  id: number = 0;
  name: string = '';
}

export class ICategoryBDI {
  id: number = 0;
  nameTemp: string = '';
  parent: ICategoryParentBDI = { id: 0, name: '' };
}

export class ITechnicalSpecificationBDI {
  headerName: string = '';
  attributeName: string = '';
  attributeDisplay: string = '';
  attributeValue: string = '';
}

export class ICategoryParentBDI {
  id: number = 0;
  name: string = '';
}

export class Attribute {
  headerName: string = '';
  attributeName: string = '';
  attributeDisplay: string = '';
  attributeValue: string = '';
}