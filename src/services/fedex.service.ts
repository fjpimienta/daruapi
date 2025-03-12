import fetch from 'node-fetch';
import ResolversOperationsService from './resolvers-operaciones.service';
import { IContextData } from '../interfaces/context-data.interface';
import { getEnvironment } from '../config/environments';
import { IFedExRequest, IFedExTransitTimeResponse, ITransitTime, ITransitTimeDetail, IShipmentFedex, IFedExService } from '../interfaces/fedex.interface';

class FedExService extends ResolversOperationsService {
  baseURL = 'https://apis-sandbox.fedex.com/ship/v1/'; // Or production URL

  // Mapa de códigos de estado de México
  private stateCodeMap: { [key: string]: string } = {
    'TB': 'TB',
    'YU': 'YU',
    'AGS': 'AG', // Aguascalientes
    'BCN': 'BC', // Baja California
    'BCS': 'BS', // Baja California Sur
    'CAM': 'CM', // Campeche
    'CHP': 'CS', // Chiapas
    'CHH': 'CH', // Chihuahua
    'COA': 'CO', // Coahuila
    'COL': 'CL', // Colima
    'DIF': 'DF', // Ciudad de México
    'DUR': 'DG', // Durango
    'GUA': 'GT', // Guanajuato
    'GRO': 'GR', // Guerrero
    'HID': 'HG', // Hidalgo
    'JAL': 'JA', // Jalisco
    'MEX': 'EM', // Estado de México
    'MIC': 'MI', // Michoacán
    'MOR': 'MO', // Morelos
    'NAY': 'NA', // Nayarit
    'NLE': 'NL', // Nuevo León
    'OAX': 'OA', // Oaxaca
    'PUE': 'PU', // Puebla
    'QUE': 'QT', // Querétaro
    'ROO': 'QR', // Quintana Roo
    'SLP': 'SL', // San Luis Potosí
    'SIN': 'SI', // Sinaloa
    'SON': 'SO', // Sonora
    'TAB': 'TB', // Tabasco
    'TAM': 'TM', // Tamaulipas
    'TLA': 'TL', // Tlaxcala
    'VER': 'VE', // Veracruz
    'YUC': 'YU', // Yucatán
    'ZAC': 'ZA'  // Zacatecas
  };

  // Tipos de servicio disponibles en México
  private fedexServices = [
    "FEDEX_EXPRESS_SAVER",
    "STANDARD_OVERNIGHT",
    "FEDEX_GROUND",
    "FEDEX_2_DAY",
    "INTERNATIONAL_ECONOMY"
  ];

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  private getStateCode(stateCode: string): string {
    const code = stateCode.toUpperCase();
    return this.stateCodeMap[code] || code;
  }

  async getTokenFedex() {
    const environment = getEnvironment();
    const clientId = environment.fedex.client_id;
    const clientSecret = environment.fedex.client_secret;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    };
    const result = await fetch('https://apis-sandbox.fedex.com/oauth/token', options);
    if (result.ok) {
      const data = await result.json();
      return {
        status: true,
        message: 'El token se ha generado correctamente.',
        tokenFedex: data
      };
    } else {
      const errorText = await result.text();
      return {
        status: false,
        message: `Error en el servicio. Status: ${result.status}, Text: ${errorText}`,
        tokenFedex: null
      };
    }
  }

  private async retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  async getTransitTimes() {
    try {
      return await this.retry(async () => {
        const tokenResult = await this.getTokenFedex();
        if (!tokenResult.status || !tokenResult.tokenFedex) {
          return {
            status: false,
            message: tokenResult.message || "Failed to retrieve FedEx token.",
            transitTimesFedex: null,
          };
        }
        const token = tokenResult.tokenFedex.access_token;
        const shipmentFedex = this.getVariables().shipmentFedex as IShipmentFedex;

        if (!shipmentFedex) {
          return {
            status: false,
            message: "Shipping details are required",
            transitTimesFedex: null,
          };
        }

        const environment = getEnvironment();
        const fedex_account = environment.fedex.fedex_account;

        // Convertir códigos de estado al formato correcto
        const originState = this.getStateCode(shipmentFedex.origin.stateOrProvinceCode);
        const destState = this.getStateCode(shipmentFedex.destination.stateOrProvinceCode);

        const payload = {
          accountNumber: {
            value: fedex_account
          },
          requestedShipment: {
            shipper: {
              address: {
                postalCode: shipmentFedex.origin.postalCode,
                countryCode: "MX",
                stateOrProvinceCode: this.getStateCode(shipmentFedex.origin.stateOrProvinceCode),
                city: shipmentFedex.origin.city,
                streetLines: shipmentFedex.origin.streetLines,
                residential: false
              }
            },
            recipient: {
              address: {
                postalCode: shipmentFedex.destination.postalCode,
                countryCode: "MX",
                stateOrProvinceCode: this.getStateCode(shipmentFedex.destination.stateOrProvinceCode),
                city: shipmentFedex.destination.city,
                streetLines: shipmentFedex.destination.streetLines,
                residential: true
              }
            },
            preferredCurrency: "MXN",
            rateRequestType: ["ACCOUNT", "LIST"],
            pickupType: "DROPOFF_AT_FEDEX_LOCATION",
            serviceType: "FEDEX_EXPRESS_SAVER",
            packagingType: "YOUR_PACKAGING",
            requestedPackageLineItems: [{
              weight: {
                units: "KG",
                value: shipmentFedex.packageDetails.weight
              },
              dimensions: {
                length: shipmentFedex.packageDetails.dimensions.length,
                width: shipmentFedex.packageDetails.dimensions.width,
                height: shipmentFedex.packageDetails.dimensions.height,
                units: "CM"
              },
              groupPackageCount: 1
            }],
            rateRequestControlParameters: {
              returnTransitTimes: true
            }
          }
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch("https://apis-sandbox.fedex.com/rate/v1/rates/quotes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-locale": "es_MX",  // Cambiado a español México
            "Authorization": `Bearer ${token}`,
            "X-Customer-Transaction-Id": `daru-${Date.now()}`
          },
          body: JSON.stringify(payload)
        });

        // Mostrar la respuesta completa para debugging
        const responseText = await response.text();
        console.log('Response raw:', responseText);

        if (!response.ok) {
          console.error("Error response:", responseText);
          return {
            status: false,
            message: `Error en el servicio: ${response.status} - ${responseText}`,
            transitTimesFedex: null
          };
        }

        const data = JSON.parse(responseText);
        console.log('Response data:', JSON.stringify(data, null, 2));

        // Manejar la nueva estructura de respuesta de cotización
        if (data.output?.rateReplyDetails) {
          console.log('Rate details:', JSON.stringify(data.output.rateReplyDetails, null, 2));
          const services = data.output.rateReplyDetails
            .filter((rate: any) => rate.serviceType)
            .map((rate: any): IFedExService => {
              const commitDetail = rate.commit?.commitMessageDetails?.[0] || {};
              
              return {
                serviceType: rate.serviceType,
                deliveryDate: commitDetail.deliveryTime || 'No disponible',
                transitTime: commitDetail.daysInTransit 
                  ? `${commitDetail.daysInTransit} día(s)`
                  : 'No disponible',
                rate: {
                  amount: rate.ratedShipmentDetails?.[0]?.totalNetCharge || 0,
                  currency: rate.ratedShipmentDetails?.[0]?.currency || 'MXN'
                }
              };
            });

          if (services.length > 0) {
            return {
              status: true,
              message: "Tiempos de tránsito obtenidos exitosamente",
              transitTimesFedex: { services }
            };
          }
        }

        return {
          status: false,
          message: "No se encontraron servicios disponibles para esta ruta",
          transitTimesFedex: null
        };

      });
    } catch (error: unknown) {
      console.error("Error after retries:", error);
      return {
        status: false,
        message: error instanceof Error 
          ? `Error después de reintentos: ${error.message}`
          : "Error desconocido después de reintentos",
        transitTimesFedex: null
      };
    }
  }
}

export default FedExService;
