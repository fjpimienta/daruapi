import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { IDelivery } from '../interfaces/delivery.interface';
import { asignDocumentId, findOneElement } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import { IWarehouse } from '../interfaces/warehouses.interface';
import { IEnvioCt, IGuiaConnect, IOrderCt, IOrderCtResponse, IProductOrderCt } from '../interfaces/suppliers/_CtsShippments.interface';
import { IProductShipment } from '../interfaces/productShipment.interface';
import { IEnvioCVA, IOrderCva, IProductoCva } from '../interfaces/suppliers/_CvasShippments.interface';
import hRCvaCiudades from './../json/cva_ciudades.json';
import { FF } from './../constants/constants';
import ExternalCvasService from './externalCvas.service';
import { IErroresCT, IOrderCtConfirm, IOrderCtConfirmResponse } from '../interfaces/suppliers/orderctresponse.interface';
import { IOrderCvaResponse } from '../interfaces/suppliers/ordercvaresponse.interface';
import ExternalOpenpayService from './externalOpenpay.service';
import { IChargeOpenpay } from '../interfaces/suppliers/_Openpay.interface';
import ExternalCtsService from './externalCts.service';

class DeliverysService extends ResolversOperationsService {
  collection = COLLECTIONS.DELIVERYS;
  catalogName = 'Deliverys';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion
  async items(variables: IVariables) {
    const active = variables.active;
    const filterName = variables.filterName;
    let filter: object;
    const regExp = new RegExp('.*' + filterName + '.*', 'i');
    if (filterName === '' || filterName === undefined) {
      filter = { active: { $ne: false } };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = {};
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false } };
      }
    } else {
      filter = { active: { $ne: false }, 'cliente': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'cliente': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'cliente': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const order = { "id": -1 };
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter, order);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      deliverys: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.getByDelivery(this.collection);
    return {
      status: result.status,
      message: result.message,
      delivery: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      deliveryId: result.catId
    };
  }

  // Insert Delivery
  async insert(context: IContextData) {
    let status = 'PEDIDO CREADO'
    const delivery = this.getVariables().delivery;
    const idDelivery = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    if (delivery) {
      delivery.id = idDelivery;
      delivery.status = status;
      delivery.registerDate = new Date().toISOString();
      // Insertar Pedido Inicial
      const result = await this.add(this.collection, delivery, 'delivery');
      if (result && result.status) {
        // Realizar el Cargo al Cliente
        const chargeOpenpay: any = { chargeOpenpay: delivery.chargeOpenpay }
        const resultOpenpay = await new ExternalOpenpayService({}, chargeOpenpay, context).createCharge(chargeOpenpay)
          .then(async resultCharge => {
            try {
              status = 'CARGO INICIADO';
              return await {
                status: resultCharge.status,
                message: resultCharge.message,
                createChargeOpenpay: resultCharge.createChargeOpenpay
              };
            } catch (error) {
              status = 'CARGO RECHAZADO';
              return await {
                status: resultCharge.status,
                message: resultCharge.message,
                createChargeOpenpay: null
              };
            }
          });
        // Si el cargo es correcto actualizar estatus del pedido
        if (resultOpenpay && resultOpenpay.status) {
          const deliveryUpdate: IDelivery = result.item as IDelivery;
          deliveryUpdate.status = status;
          deliveryUpdate.chargeOpenpay = resultOpenpay.createChargeOpenpay as IChargeOpenpay;
          deliveryUpdate.lastUpdate = new Date().toISOString();
          const filter = { id: idDelivery };
          const resultUpdate = await this.update(this.collection, filter, deliveryUpdate, 'Pedido');
          if (resultUpdate && resultUpdate.status) {
            return await {
              status: resultUpdate.status,
              message: resultUpdate.message,
              delivery: deliveryUpdate
            }
          }
          return await {
            status: resultUpdate.status,
            message: resultUpdate.message,
            delivery: result.item
          }
        }
        // Si hay error en el cargo de Openpay
        const deliveryUpdate: IDelivery = result.item as IDelivery;
        deliveryUpdate.status = status;
        deliveryUpdate.statusError = !resultOpenpay.status;
        deliveryUpdate.messageError = resultOpenpay.message;
        deliveryUpdate.lastUpdate = new Date().toISOString();
        const filter = { id: idDelivery };
        const resultUpdate = await this.update(this.collection, filter, deliveryUpdate, 'Pedido');
        console.log('resultUpdate con error: ', resultUpdate);
        if (resultUpdate && resultUpdate.status) {
          return await {
            status: resultOpenpay.status,
            message: resultOpenpay.message,
            delivery: resultUpdate.item
          }
        }
        return await {
          status: resultOpenpay.status,
          message: resultOpenpay.message,
          delivery: result.item
        }
      }
      return {
        status: result.status,
        message: result.message,
        delivery: null
      };
    }
    return {
      status: false,
      mesage: 'Compra no definida, verificar datos.',
      delivery: null
    };
  }

  // Update Delivery
  async modify(context: IContextData) {
    let status = 'AUTORIZANDO CARGO';
    let statusError = false;
    let messageError = '';
    const delivery = this.getVariables().delivery;
    // Si el pago fue autorizado.
    if (delivery) {
      const id = delivery.id ? parseInt(delivery.id) : 0;
      const ordersCts: IOrderCt[] = [];
      const ordersCvas: IOrderCva[] = [];
      const warehouses: IWarehouse[] = delivery?.warehouses || [];
      const idTransactionOpenpay = delivery.chargeOpenpay.id;
      const resultOpenpay = await new ExternalOpenpayService({}, { idTransactionOpenpay }, context).oneCharge({ idTransactionOpenpay })
        .then(async resultCharge => {
          try {
            if (resultCharge && resultCharge.chargeOpenpay) {
              return await resultCharge;
            }
            return await {
              status: resultCharge.status,
              message: resultCharge.message,
              chargeOpenpay: null
            };
          } catch (error) {
            return await {
              status: resultCharge.status,
              message: resultCharge.message,
              chargeOpenpay: null
            };
          }
        });
      let chargeOpenpay: IChargeOpenpay;
      if (resultOpenpay && resultOpenpay.chargeOpenpay && resultOpenpay.chargeOpenpay.status === 'completed') {
        chargeOpenpay = resultOpenpay.chargeOpenpay;
        status = 'CARGO COMPLETADO';
        // Realizar el Pedido
        for (const idWar in Object.keys(warehouses)) {
          const warehouse: IWarehouse = warehouses[idWar];
          const supplier = warehouse.suppliersProd.idProveedor;
          status = 'PEDIDO SOLICITADO';
          switch (supplier) {
            case 'ct':
              const ordersCt = await this.setOrder(id, delivery, warehouse);
              console.log('ordersCt: ', ordersCt);
              const orderCtResponse = await this.EfectuarPedidos(supplier, ordersCt, context)
                .then(async (result) => {
                  return await result;
                });
              ordersCt.orderCtResponse = orderCtResponse;
              // Confirmar pedido
              const orderCtConfirm: IOrderCtConfirm = { folio: orderCtResponse.pedidoWeb };
              if (orderCtResponse.estatus === 'Mal Pedido') {
                status = 'ERROR PEDIDO PROVEEDOR';
                orderCtConfirm.folio = 'NA';
                statusError = true;
                messageError = orderCtResponse.errores[0].errorMessage;
                break;
              }
              const CONFIRMAR_PEDIDO = process.env.CONFIRMAR_PEDIDO;
              if (CONFIRMAR_PEDIDO === 'true') {
                status = 'PEDIDO CONFIRMADO CON PROVEEDOR';
                const orderCtConfirmResponse = await this.ConfirmarPedidos(supplier, orderCtConfirm, context);
                if (orderCtConfirmResponse && orderCtConfirmResponse.okCode !== '2000') {
                  status = 'PEDIDO SIN CONFIRMAR POR EL PROVEEDOR';
                }
                ordersCt.orderCtConfirmResponse = orderCtConfirmResponse;
              }
              ordersCts.push(ordersCt);
              console.log('ordersCts: ', ordersCts);
              break;
            case 'cva':
              status = 'PEDIDO CONFIRMADO CON PROVEEDOR';
              const ordersCva = await this.setOrder(id, delivery, warehouse);
              const orderCvaResponse = await this.EfectuarPedidos(supplier, ordersCva, context)
                .then(async (result) => {
                  return await result;
                });
              ordersCva.orderCvaResponse = orderCvaResponse;
              if (orderCvaResponse.estado === 'ERROR') {
                status = 'ERROR PEDIDO PROVEEDOR';
                statusError = true;
                messageError = orderCvaResponse.error;
              }
              ordersCvas.push(ordersCva);
              break;
            case 'ingram':
              break;
          }
        }
      } else {
        if (resultOpenpay) {
          statusError = true;
          messageError = resultOpenpay.message;
        }
        chargeOpenpay = delivery.chargeOpenpay;
        status = 'CARGO PENDIENTE';
      }
      // Actualizar Delivery
      const deliveryUpdate: IDelivery = delivery as IDelivery;
      deliveryUpdate.status = status;
      deliveryUpdate.ordersCt = ordersCts;
      deliveryUpdate.ordersCva = ordersCvas;
      deliveryUpdate.chargeOpenpay = chargeOpenpay;
      deliveryUpdate.lastUpdate = new Date().toISOString();
      deliveryUpdate.status = status;
      deliveryUpdate.messageError = messageError;
      deliveryUpdate.statusError = statusError;

      const filter = { id: id.toString() };

      const resultUpdate = await this.updateForce(this.collection, filter, deliveryUpdate, 'Pedido');
      if (resultUpdate && resultUpdate.status) {
        // Si se guarda el envio, inactivar el cupon.
        if (delivery && delivery?.user) {
          const collection = COLLECTIONS.WELCOMES;
          const filter = {
            email: delivery?.user.email
          }
          const welcome = await this.getByField(collection, filter);
          if (welcome && welcome.item) {
            const id = { id: welcome.item.id };
            const active = { active: false };
            await this.update(collection, id, active, 'welcome');
          }
        }
        return await {
          status: resultUpdate.status,
          message: resultUpdate.message,
          delivery: deliveryUpdate
        }
      }

    }
    return {
      status: false,
      mesage: 'Problemas con el cargo, verificar datos.',
      delivery: null
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Delivery no se ha especificado correctamente.`,
        delivery: null
      };
    }
    const result = await this.del(this.collection, { id }, 'almacen');
    return {
      status: result.status,
      message: result.message
    };
  }

  // Bloquear item
  async unblock(unblock: boolean, admin: boolean) {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Delivery no se ha especificado correctamente.`,
        delivery: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'almacen');
    const action = (unblock) ? 'Activado' : 'Desactivado';
    return {
      status: result.status,
      message: (result.message) ? `${action} correctamente` : `No se ha ${action.toLowerCase()} comprobarlo por favor`
    };
  }

  // Comprobar que no esta en blanco ni es indefinido
  private checkData(value: string) {
    return (value === '' || value === undefined) ? false : true;
  }

  // Verificar existencia en Base de Datos
  private async checkInDatabase(value: string) {
    return await findOneElement(this.getDB(), this.collection, {
      almacen: value
    });
  }

  quitarAcentos(cadena: string): string {
    return cadena.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  removeAccents(text: string): string {
    const accents = 'ÁÉÍÓÚáéíóú';
    const accentsOut = 'AEIOUaeiou';
    const mapAccents: { [key: string]: string } = {};
    const textArray = text.split('');
    accents.split('').forEach((accent, index) => {
      mapAccents[accent] = accentsOut[index];
    });
    return textArray
      .map((char) => mapAccents[char] || char)
      .join('');
  }

  //#region Pedidos

  private async setOrder(idDelivery: number, delivery: IDelivery, warehouse: IWarehouse,): Promise<any> {
    const user = delivery.user;
    if (user && user.addresses && user.addresses.length > 0) {
      const dir = user.addresses && user.addresses.length > 0 ? user.addresses[0] : null;
      switch (warehouse.suppliersProd.idProveedor) {
        case 'ct':
          const guiaConnect: IGuiaConnect = {
            generarGuia: true,
            paqueteria: warehouse.shipments[0].empresa || ''
          }
          const enviosCt: IEnvioCt[] = [];
          const telefono = dir?.phone ? parseInt(dir?.phone, 10) : 0;
          const envioCt: IEnvioCt = {
            nombre: user.name?.toUpperCase() + ' ' + user.lastname?.toUpperCase(),
            direccion: dir?.directions || '' || '',
            entreCalles: dir?.references || '',
            colonia: dir?.d_asenta || '',
            estado: dir?.d_estado || '',
            ciudad: dir?.d_mnpio || '',
            noExterior: dir?.outdoorNumber || '',
            noInterior: dir?.interiorNumber || '',
            codigoPostal: dir?.d_codigo.padStart(5, '0') || '',
            telefono,
          };
          enviosCt.push(envioCt);
          const ProductosCt: IProductOrderCt[] = [];
          for (const idPS in Object.keys(warehouse.productShipments)) {
            const prod: IProductShipment = warehouse.productShipments[idPS];
            const productCt: IProductOrderCt = {
              cantidad: prod.cantidad || 0,
              clave: prod.producto || '',
              moneda: prod.moneda || '',
              precio: prod.priceSupplier || 0,
            };
            ProductosCt.push(productCt);
          }
          const orderCtSupplier: IOrderCt = {
            idPedido: idDelivery,
            almacen: warehouse.productShipments[0].almacen,
            tipoPago: '99',
            guiaConnect: guiaConnect,
            envio: enviosCt,
            producto: ProductosCt,
            cfdi: 'G01'
          };
          return orderCtSupplier;
        case 'cva':
          const enviosCva: IEnvioCVA[] = [];
          const envioCva: IEnvioCVA = {
            nombre: user.name?.toUpperCase() + ' ' + user.lastname?.toUpperCase(),
            direccion: dir?.directions || '',
            entreCalles: dir?.references !== '' ? dir?.references || '' : '.',
            colonia: dir?.d_asenta || '',
            estado: dir?.d_estado || '',
            ciudad: dir?.d_mnpio || '',
            noExterior: dir?.outdoorNumber || '',
            noInterior: dir?.interiorNumber !== '' ? dir?.interiorNumber || '' : '0',
            codigoPostal: dir?.d_codigo.padStart(5, '0') || '',
            telefono: dir?.phone || '',
          };
          enviosCva.push(envioCva);

          const ProductosCva: IProductoCva[] = [];
          for (const idPS in Object.keys(warehouse.productShipments)) {
            const prod: IProductShipment = warehouse.productShipments[idPS];
            const productCva: IProductoCva = {
              clave: prod.producto || '',
              cantidad: prod.cantidad || 0
            };
            ProductosCva.push(productCva);
          }
          const ciudadesCVA = hRCvaCiudades;

          let estado = 0.0;
          let ciudad = '';
          if (ciudadesCVA.length > 0 && ciudadesCVA.length > 0 && dir) {
            const estadoEncontrado = ciudadesCVA.find(
              result => this.quitarAcentos(result.estado.toUpperCase()) === this.quitarAcentos(dir?.d_estado?.toUpperCase() || '')
            );
            const ciudadEncontrada = ciudadesCVA.find(
              city => city.ciudad.toUpperCase() === dir?.d_mnpio?.toUpperCase() || ''
            );
            if (estadoEncontrado) {
              estado = parseFloat(estadoEncontrado.id);
            }
            if (ciudadEncontrada) {
              ciudad = ciudadEncontrada.clave;
            }
          }
          const orderCvaSupplier: IOrderCva = {
            NumOC: 'DARU-' + idDelivery.toString().padStart(6, '0'),
            Paqueteria: '4',
            CodigoSucursal: warehouse.id,
            PedidoBO: 'N',
            Observaciones: 'Pedido: DARU-' + idDelivery.toString().padStart(6, '0') + ' - ' + delivery.deliveryId,
            productos: ProductosCva,
            TipoFlete: FF,
            Calle: this.removeAccents(dir?.directions || ''),
            Numero: dir?.outdoorNumber || '',
            NumeroInt: dir?.interiorNumber || '',
            CP: warehouse.productShipments[0].cp,
            Colonia: this.removeAccents(dir?.d_asenta || ''),
            Estado: Math.round(estado).toString(),
            Ciudad: ciudad,
            Atencion: this.removeAccents(user?.name?.toUpperCase() + ' ' + user?.lastname?.toUpperCase())
          };
          return orderCvaSupplier;
        case 'ingram':
          return '';
      }
      return '';
    }
  }

  async EfectuarPedidos(supplierName: string, order: any, context: IContextData): Promise<any> {
    switch (supplierName) {
      case 'cva':
        const pedidosCva = await new ExternalCvasService({}, { pedidoCva: order }, context).setOrderCva({ pedidoCva: order })
          .then(async resultPedido => {
            try {
              const { orderCva } = resultPedido as { orderCva?: any };
              const cvaResponse: IOrderCvaResponse = {
                agentemail: orderCva?.agentemail || '',
                almacenmail: orderCva?.almacenmail || '',
                error: orderCva?.error || '',
                estado: orderCva?.estado || '',
                pedido: orderCva?.pedido || '0',
                total: orderCva?.total || '0',
              };
              return await cvaResponse;
            } catch (error) {
              throw await error;
            }
          });
        return await pedidosCva;
      case 'ct':
        const pedidosCt = await new ExternalCtsService({}, order, context).setOrderCt(order)
          .then(async resultPedido => {
            try {
              if (!resultPedido.orderCt) {                              // Hay error en el pedido.
                let errorCT: IErroresCT = {
                  errorCode: '999999',
                  errorMessage: resultPedido.message,
                  errorReference: ''
                };
                let erroresCT: IErroresCT[] = [];
                erroresCT.push(errorCT);
                const ctResponse: IOrderCtResponse = {
                  estatus: 'Mal Pedido',
                  fecha: new Date(Date.now()).toString(),
                  pedidoWeb: '',
                  tipoDeCambio: 0,
                  errores: erroresCT
                };
                return await ctResponse;
              }
              const ctResponse: IOrderCtResponse = {
                estatus: resultPedido.orderCt.estatus,
                fecha: resultPedido.orderCt.fecha,
                pedidoWeb: resultPedido.orderCt.pedidoWeb,
                tipoDeCambio: resultPedido.orderCt.tipoDeCambio,
                errores: resultPedido.orderCt.errores
              };
              return await ctResponse;
            } catch (error) {
              console.log('error: ', error);
              let errorCT: IErroresCT = {
                errorCode: '999999',
                errorMessage: error as string,
                errorReference: ''
              };
              let erroresCT: IErroresCT[] = [];
              erroresCT.push(errorCT);
              const ctResponse: IOrderCtResponse = {
                estatus: 'Mal Pedido',
                fecha: new Date(Date.now()).toString(),
                pedidoWeb: '',
                tipoDeCambio: 0,
                errores: erroresCT
              };
              return await ctResponse;
            }
          });
        return await pedidosCt;
    }
  }

  async ConfirmarPedidos(supplierName: string, orderCtConfirm: any, context: IContextData) {
    switch (supplierName) {
      case 'ct':
        if (orderCtConfirm.folio = 'NA') {
          const ctConfirmResponse: IOrderCtConfirmResponse = {
            okCode: '500',
            okMessage: 'Error en pedido',
            okReference: 'Denegado por el proveedor'
          };
          return await ctConfirmResponse;
        }
        const confirmpedidoCt = await new ExternalCtsService({}, orderCtConfirm, context).setConfirmOrderCt(orderCtConfirm.folio)
          .then(async resultConfirm => {
            try {
              const ctConfirmResponse: IOrderCtConfirmResponse = {
                okCode: resultConfirm.confirmOrderCt?.okCode,
                okMessage: resultConfirm.confirmOrderCt?.okMessage,
                okReference: resultConfirm.confirmOrderCt?.okReference
              };
              return await ctConfirmResponse;
            } catch (error) {
              const ctConfirmResponse: IOrderCtConfirmResponse = {
                okCode: '500',
                okMessage: error as string,
                okReference: ''
              };
              return await ctConfirmResponse;
            }
          });
        return await confirmpedidoCt;
    }
  }
}

export default DeliverysService;