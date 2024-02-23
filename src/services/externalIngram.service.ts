import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import logger from '../utils/logger';
import fetch from 'node-fetch';
import { IIngramProduct, IPricesIngram, IProductsQuery } from '../interfaces/suppliers/_Ingram.interface';
import { COLLECTIONS } from '../config/constants';

class ExternalIngramService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos Ingram';

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async getTokenIngram() {
    const username = 'ZpGbzheF2yQlsfA00vuvu4JdXkf76w9L';
    const password = 'WOPaXqEcyG3kQGJw';

    const data = `${username}:${password}`;
    const base64String = Buffer.from(data).toString('base64');

    const encodedCredentials = base64String;
    const optionsIngram = {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      }).toString(),
      redirect: 'manual' as RequestRedirect
    };

    const tokenIngram = await fetch('https://api.ingrammicro.com:443/oauth/oauth30/token', optionsIngram)
      .then(response => response.json())
      .then(async response => {
        return await response;
      })
      .catch(err => console.error(err));

    const status = tokenIngram.access_token !== '' ? true : false;
    const message = tokenIngram.access_token !== '' ? 'El token se ha generado correctamente. data:' : 'Error en el servicio. ' + JSON.stringify(data);

    return {
      status,
      message,
      tokenIngram
    };
  }

  async getIngramProduct(variables: IVariables) {
    try {
      let { ingramPartNumber } = variables;

      if (ingramPartNumber === undefined) {
        const result = await this.getByField(this.collection);
        ingramPartNumber = result.item.imSKU.trim();
      }

      if (!ingramPartNumber) {
        return {
          status: false,
          message: `No existe el producto ${ingramPartNumber}`,
          ingramProduct: null,
        };
      }
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/catalog/details';
      const optionsIngram = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token
        },
      };
      const url = `${apiUrl}/${ingramPartNumber}`;
      const response = await fetch(url, optionsIngram);
      const responseJson = await response.json();
      if (response.statusText === 'OK') {
        return {
          status: true,
          message: `El producto ${ingramPartNumber} se ha encontrado.`,
          ingramProduct: responseJson,
        };
      } else {
        return {
          status: false,
          message: `No existe el producto ${ingramPartNumber}`,
          ingramProduct: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        ingramProduct: null,
      };
    }
  }

  async getIngramProducts() {
    try {
      // Get todos los productos.
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/catalog';
      const optionsIngram = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token
        },
      };
      const url = `${apiUrl}/?pageNumber=1&pageSize=10000&type=IM::any`;
      const response = await fetch(url, optionsIngram);
      const responseJson = await response.json();
      if (response.statusText === 'OK') {
        return await {
          status: true,
          message: `Se ha generado la lista de productos.`,
          ingramProducts: responseJson.catalog,
        };
      } else {
        return await {
          status: false,
          message: `No se ha generado la lista de productos.`,
          ingramProducts: [],
        };
      }
    } catch (error: any) {
      return await {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        ingramProducts: [],
      };
    }
  }

  async getPricesIngram(variables: IVariables) {
    try {
      // Get todos los productos.
      const { allRecords } = variables;
      const productosIngram = await this.getIngramProducts();
      if (productosIngram.status && productosIngram.ingramProducts.length > 0) {
        // Generar bloques de 50 productos.
        let i = 0;
        let partsNumber: IProductsQuery[] = [];
        const pricesIngram: IPricesIngram[] = [];
        for (const prod of productosIngram.ingramProducts) {
          if (prod.stockAvailableYN === "Y" || prod.vendorName.toUpperCase() !== "APPLE TEST") {
            i += 1;
            partsNumber.push({ ingramPartNumber: prod.ingramPartNumber });
            if (i % 50 === 0) {
              const productPrices = await this.getPricesIngramBloque(partsNumber)
              for (const prodPrices of productPrices.pricesIngram) {
                if (allRecords) {
                  pricesIngram.push(prodPrices);
                } else if (prodPrices.availability && ['A', 'B', 'C'].includes(prodPrices.productClass)) {
                  pricesIngram.push(prodPrices);
                }
              }
              partsNumber = [];
            }
          }
        }
        // Verificar si quedan productos pendientes.
        if (partsNumber.length > 0) {
          const productPrices = await this.getPricesIngramBloque(partsNumber);
          for (const prodPrices of productPrices.pricesIngram) {
            if (prodPrices.availability) {
              pricesIngram.push(prodPrices);
            }
          }
        }
        if (pricesIngram.length > 0) {
          // Agregar categorias y subcategorias
          for (const priceItem of pricesIngram) {
            const item = productosIngram.ingramProducts.find((x: IIngramProduct) => x.vendorPartNumber === priceItem.vendorPartNumber);
            if (item) {
              priceItem.category = item.category ? item.category : '';
              priceItem.subCategory = item.subCategory ? item.subCategory : '';
              priceItem.newProduct = item.newProduct === 'true' ? true : false;
            }
          }
          // Fin Agregar
          return {
            status: true,
            message: `Se ha generado la lista de precios de productos.`,
            pricesIngram
          };
        } else {
          return {
            status: false,
            message: `No se han encontrado productos.`,
            pricesIngram: null,
          };
        }
      } else {
        return {
          status: false,
          message: `No se ha generado la lista de precios de productos.`,
          pricesIngram: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        ingramProduct: null,
      };
    }
  }

  async getCatalogIngram(variables: IVariables) {
    try {
      const result = await this.getByField(this.collection);
      return {
        status: result.status,
        message: result.message,
        catalogIngram: result.item
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        catalogIngram: null,
      };
    }
  }

  async getCatalogIngrams() {
    // Extraer solo los productos disponibles en Ingram.
    const filter: object = { "stockAvailableYN": "Y" }
    const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
    return {
      status: result.status,
      message: result.message,
      catalogIngrams: result.items
    };
  }

  async getPricesIngramBloque(productsQuery: IProductsQuery[]) {
    try {
      // Consultar precio y disponibilidad por bloques de 100.
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/catalog/priceandavailability';
      const optionsIngram = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token,
        },
        body: JSON.stringify({
          'showAvailableDiscounts': true,
          'showReserveInventoryDetails': true,
          'availabilityByWarehouse': {
            'availabilityForAllLocation': true
          },
          'products': productsQuery
        }),
        redirect: 'manual' as RequestRedirect
      };
      const url = `${apiUrl}?includeAvailability=true&includePricing=true&includeProductAttributes=true`;
      const response = await fetch(url, optionsIngram);
      const responseJson = await response.json();
      if (response.statusText === 'OK' || response.status === 207) {
        return {
          status: true,
          message: `Se ha generado la lista de precios de productos.`,
          pricesIngram: responseJson,
        };
      } else {
        return {
          status: false,
          message: `No se ha generado la lista de precios de productos.`,
          pricesIngram: [],
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        pricesIngram: [],
      };
    }
  }

  async setOrderIngram(variables: IVariables){
    console.log('variables: ', variables);
  }

  async getListOrderIngram() {

  }
}

export default ExternalIngramService;