import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { IDelivery } from '../interfaces/delivery.interface';
import { asignDocumentId, findElements, findOneElement } from '../lib/db-operations';
import { pagination } from '../lib/pagination';
import ResolversOperationsService from './resolvers-operaciones.service';
import { IWarehouse } from '../interfaces/warehouses.interface';
import { IEnvioCt, IGuiaConnect, IOrderCt, IProductOrderCt } from '../interfaces/suppliers/_CtsShippments.interface';
import { IProductShipment } from '../interfaces/productShipment.interface';
import { IEnvioCVA, IProductoCva } from '../interfaces/suppliers/_CvasShippments.interface';

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

  // Anadir Item
  async insert() {
    const delivery = this.getVariables().delivery;
    if (!delivery || !this.checkData(delivery?.deliveryId || '')) {
      // Si no llega el delivery
      return {
        status: false,
        message: `El Delivery no se ha especificado correctamente`,
        delivery: null
      };
    }

    console.log('chargeOpenpay: ', delivery?.chargeOpenpay);

    // Comprobar que no existe
    if (await this.checkInDatabase(delivery?.deliveryId || '')) {
      return {
        status: false,
        message: `El Delivery ya existe en la base de datos, intenta con otro almacen`,
        delivery: null
      };
    }

    // Variables
    const warehouses: IWarehouse[] = delivery?.warehouses || [];
    console.log('warehouses: ', warehouses);
    const resultID = await this.nextId(this.collection);
    let deliveryID = 0;
    if (resultID.status && resultID.catId) {
      deliveryID = parseInt(resultID.catId);
    }
    // Generar el Pedido con el provedor
    for (const idWar in Object.keys(warehouses)) {
      const warehouse: IWarehouse = warehouses[idWar];
      console.log('warehouse: ', warehouse);
      const supplier = warehouse.suppliersProd.idProveedor;
      console.log('supplier: ', supplier);
      const order = await this.setOrder(deliveryID, delivery, warehouse);
      console.log('order: ', order);
      // switch (warehouse.suppliersProd.idProveedor) {
      //   case 'ct':
      //     // order.pedido = 'DARU-' + id.toString().padStart(6, '0');
      //     ordersCt.push(order);
      //     break;
      //   case 'cva':
      //     order.NumOC = 'DARU-' + id.toString().padStart(6, '0');
      //     ordersCva.push(order);
      //     break;
      //   case 'ingram':
      //     break;
      // }
      // const orderNew = await this.EfectuarPedidos(warehouse.suppliersProd.idProveedor, order)
      //   .then(async (result) => {
      //     return await result;
      //   });
      // if (orderNew) {
      //   switch (warehouse.suppliersProd.idProveedor) {
      //     case 'ct':
      //       if (orderNew.estatus === 'Mal Pedido') {
      //         orderCtResponse = orderNew;
      //         delivery.ordersCt = [];
      //         delivery.orderCtResponse = orderCtResponse;
      //         const orderCtConfirm: OrderCtConfirm = new OrderCtConfirm();
      //         orderCtConfirm.folio = 'NA';
      //         break;
      //       }
      //       orderCtResponse = orderNew;
      //       delivery.ordersCt = ordersCt;
      //       delivery.orderCtResponse = orderCtResponse;
      //       const orderCtConfirm: OrderCtConfirm = new OrderCtConfirm();
      //       orderCtConfirm.folio = orderNew.pedidoWeb;
      //       const confirmarPedidoCt = await this.externalAuthService.confirmOrderCt(orderCtConfirm.folio);
      //       const ctConfirmResponse: OrderCtConfirmResponse = {
      //         okCode: confirmarPedidoCt.confirmOrderCt.okCode.toString(),
      //         okMessage: confirmarPedidoCt.confirmOrderCt.okMessage,
      //         okReference: confirmarPedidoCt.confirmOrderCt.okReference
      //       };
      //       delivery.orderCtConfirmResponse = ctConfirmResponse;
      //       break;
      //     case 'cva':
      //       if (orderNew.estado === 'ERROR') {
      //         delivery.statusError = true;
      //         delivery.messageError = orderNew.error;
      //         return await delivery;
      //       }
      //       orderCvaResponse = orderNew;
      //       delivery.ordersCva = ordersCva;
      //       delivery.orderCvaResponse = orderCvaResponse;
      //       const confirmarPedidoCva = [];
      //       break;
      //   }
      //   // Agregar datos de facturas
      //   if (orderCtResponse.errores) {
      //     if (orderCtResponse.errores.length > 0) {
      //       delivery.statusError = true;
      //       delivery.messageError = orderCtResponse.errores[0].errorMessage;
      //     }
      //   }
      //   if (orderCvaResponse.error !== '') {
      //     delivery.statusError = true;
      //     delivery.messageError = orderCvaResponse.error;
      //   }
      // }
    }
    // Generar el cobro con openpay

    // Guardar la compra del cliente

    const deliveryObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      deliveryId: delivery?.deliveryId,
      cliente: delivery?.cliente,
      cupon: delivery?.cupon,
      discount: delivery?.discount,
      importe: delivery?.importe,
      user: delivery?.user,
      chargeOpenpay: delivery?.chargeOpenpay,
      warehouses: delivery?.warehouses,
      ordersCt: delivery?.ordersCt,
      ordersCva: delivery?.ordersCva,
      orderCtResponse: delivery?.orderCtResponse,
      orderCtConfirmResponse: delivery?.orderCtConfirmResponse,
      orderCvaResponse: delivery?.orderCvaResponse,
      invoiceConfig: delivery?.invoiceConfig,
      statusError: delivery?.statusError,
      messageError: delivery?.messageError,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, deliveryObject, 'delivery');

    // Si se guarda el envio, inactivar el cupon.
    if (result.status === true) {
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
    }
    return {
      status: result.status,
      message: result.message,
      delivery: result.item
    };

  }

  // Modificar Item
  async modify() {
    const delivery = this.getVariables().delivery;
    // Comprobar que el almacen no sea nulo.
    if (delivery === null) {
      return {
        status: false,
        mesage: 'Delivery no definido, verificar datos.',
        delivery: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(delivery?.deliveryId || '')) {
      return {
        status: false,
        message: `El Delivery no se ha especificado correctamente`,
        delivery: null
      };
    }
    const objectUpdate = {
      deliveryId: delivery?.deliveryId,
      cliente: delivery?.cliente,
      cupon: delivery?.cupon,
      discount: delivery?.discount,
      importe: delivery?.importe,
      user: delivery?.user,
      warehouses: delivery?.warehouses,
      ordersCt: delivery?.ordersCt,
      ordersCva: delivery?.ordersCva,
      orderCtResponse: delivery?.orderCtResponse,
      orderCtConfirmResponse: delivery?.orderCtConfirmResponse,
      orderCvaResponse: delivery?.orderCvaResponse,
      invoiceConfig: delivery?.invoiceConfig,
      statusError: delivery?.statusError,
      messageError: delivery?.messageError,
    };
    // Conocer el id del almacen
    const filter = { id: delivery?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'almacenes');
    return {
      status: result.status,
      message: result.message,
      delivery: result.item
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

  private async setOrder(deliveryID: number, delivery: IDelivery, warehouse: IWarehouse,): Promise<any> {
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
            idPedido: deliveryID,
            almacen: warehouse.productShipments[0].almacen,
            tipoPago: '99',
            guiaConnect: guiaConnect,
            envio: enviosCt,
            productoCt: ProductosCt,
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
              clave : prod.producto || '',
              cantidad : prod.cantidad || 0
            };
            ProductosCva.push(productCva);
          }

          // const ciudadesCVA = await this.getCiudadesCva();
          // let estado;
          // let ciudad;
          // if (ciudadesCVA.length > 0) {
          //   estado = ciudadesCVA.find(
          //     result => this.quitarAcentos(result.estado.toUpperCase()) === this.quitarAcentos(dir.d_estado.toUpperCase())
          //   ).id;
          //   ciudad = ciudadesCVA.find(
          //     city => city.ciudad.toUpperCase() === dir.d_mnpio.toUpperCase()
          //   ).clave;
          // }
          // const orderCvaSupplier: OrderCva = {
          //   NumOC: 'DARU-' + pedido.toString().padStart(6, '0'),
          //   Paqueteria: '4',
          //   CodigoSucursal: warehouse.productShipments[0].almacen,
          //   PedidoBO: 'N',
          //   Observaciones: 'Pedido de Prueba',
          //   productos: ProductosCva,
          //   TipoFlete: FF,
          //   Calle: this.removeAccents(dir.directions),
          //   Numero: dir.outdoorNumber,
          //   NumeroInt: dir.interiorNumber,
          //   CP: warehouse.productShipments[0].cp,
          //   Colonia: this.removeAccents(dir.d_asenta),
          //   Estado: Math.round(estado).toString(),
          //   Ciudad: ciudad,
          //   Atencion: this.removeAccents(user.name.toUpperCase() + ' ' + user.lastname.toUpperCase())
          // };
          // return orderCvaSupplier;
        case 'ingram':
          return '';
      }
      return '';
    }

  }

  // private hRCvaCiudades$ = this.http.get('assets/uploads/json/cva_ciudades.json');

  // async getCiudadesCvaJson(): Promise<any> {
  //   const hRCvaCiudades = '/catalogo_xml/productos.json';
  //   return await hRCvaCiudades.toPromise();
  // }

  // async getCiudadesCva(): Promise<any> {
  //   const ciudadesCva = await this.getCiudadesCvaJson()
  //     .then(async (result) => {
  //       return await result;
  //     })
  //     .catch(async (error: Error) => {
  //       return await [];
  //     });
  //   return ciudadesCva;
  // }

}

export default DeliverysService;