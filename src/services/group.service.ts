import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { ICatalog } from '../interfaces/catalog.interface';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findElements, findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import { pagination } from '../lib/pagination';
import ResolversOperationsService from './resolvers-operaciones.service';

class GroupsService extends ResolversOperationsService {
  collection = COLLECTIONS.GROUPS;
  collectionSupplier = COLLECTIONS.SUPPLIERS;
  catalogName = 'Grupos';
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
      filter = { active: { $ne: false }, 'description': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'description': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'description': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const sort = { order: 1 };
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter, sort);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      groups: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      group: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      groupId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const group = this.getVariables().group;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(group?.description || '')) {
      return {
        status: false,
        message: `El Grupo no se ha especificado correctamente`,
        group: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(group?.description || '')) {
      return {
        status: false,
        message: `El Grupo ya existe en la base de datos, intenta con otro grupo`,
        group: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    // // Se agrega temporalmente el provedor principal (La empresa actual)
    // const supplierCat = {
    //   id: '1',
    //   name: 'DARU',
    //   slug: 'daru'
    // };
    // let suppliersCat = [supplierCat];
    const groupObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      description: group?.description,
      slug: slugify(group?.description || '', { lower: true }),
      order: group?.order,
      active: true,
      registerDate: new Date().toISOString()//,
      // suppliersCat
    };
    const result = await this.add(this.collection, groupObject, 'grupo');
    return {
      status: result.status,
      message: result.message,
      group: result.item
    };

  }

  // Añadir una lista
  async insertMany() {
    const groups = this.getVariables().groups;
    const supplier = this.getVariables().supplier;
    let groupsDB: ICatalog[];
    let groupsAdd: ICatalog[] = [];
    let groupsCancel: ICatalog[] = [];
    let groupsUpdate: ICatalog[] = [];

    if (groups?.length === 0) {
      return {
        status: false,
        message: 'No existen elementos para integrar',
        groups: null
      };
    }

    // Recuperar el siguiente id
    const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    let i = parseInt(id);
    let j = 1;

    // Recuperar todos los datos registrados
    const paginationData = await pagination(this.getDB(), this.collection, 1, -1, {});
    groupsDB = await findElements(this.getDB(), this.collection, {}, paginationData);

    // Iniciar el proceso de buscar elementos de los registros guardados.
    // const supplierCat = {
    //   id: supplier?.id,
    //   name: supplier?.name,
    //   slug: supplier?.slug
    // };
    // let suppliersCat = [supplierCat];

    // Registra todos los datos en el proveedor correspondiente
    if (supplier) {
      const itemSupplier = await findOneElement(this.getDB(), this.collectionSupplier, { id: supplier?.id });
      if (itemSupplier) {
        const filter = { id: supplier?.id };
        const objectUpdate = {
          catalogs: [{
            name: this.collection,
            catalog: groups
          }],
        };
        await this.update(this.collectionSupplier, filter, objectUpdate, 'proveedores');
      }
    }

    // Registra cada grupo
    groups?.forEach(group => {
      const item = groupsDB.find(item => item.description === group.description);
      if (item === undefined) {                       // Elemento que no existe se agrega
        group.id = i.toString();
        group.slug = slugify(group?.description || '', { lower: true });
        group.active = true;
        i += 1;
        groupsAdd?.push(group);
      } else {                                        // Elementos que ya exsiten, se agrega en otra data.
        const filter = { id: group?.id };             // Conocer el id de la marca
        // Localizar el supplier
        if (item.suppliersCat) {                      // Si existen guardados suppliers a ese elemento.
          let existeSupplicerCat = false;
          if (item.suppliersCat.length > 0) {         // Si existen mas de un suppliers en ese elemento.
            item.suppliersCat.forEach(supplierCat => {  // Buscar el supplier para actualizar.
              if (supplierCat.idProveedor === group.suppliersCat[0].idProveedor) {
                supplierCat = group.suppliersCat[0];
                existeSupplicerCat = true;
              }
            });
          }
          if (!existeSupplicerCat && group.suppliersCat[0].idProveedor !== '') {
            item.suppliersCat.push(group.suppliersCat[0]);
          }
        } else {
          item.suppliersCat = group.suppliersCat;
        }
        // item.suppliersCat = [];

        // Ejecutar actualización
        this.update(this.collection, filter, item, 'grupos');
        groupsUpdate?.push(item);


        // group.id = j.toString();
        // group.slug = slugify(group?.description || '', { lower: true });
        // group.active = false;
        // j += 1;
        // brandsCancel?.push(group);
      }
    });
    if (groupsAdd.length > 0) {
      const result = await this.addList(this.collection, groupsAdd || [], 'groups');
      return {
        status: result.status,
        message: result.message,
        groups: groupsAdd
      };
    }
    if (groupsUpdate.length > 0) {
      return {
        status: true,
        message: 'Se actualizo correctamente el catalogo.',
        brands: groupsUpdate
      };
    }
    return {
      status: false,
      message: 'No se agregó ningún elemento. Ya existen',
      groups: groupsCancel
    };
  }

  // Modificar Item
  async modify() {
    const group = this.getVariables().group;
    // Comprobar que la marca no sea nula.
    if (group === null) {
      return {
        status: false,
        mesage: 'Marca no definida, verificar datos.',
        group: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(group?.description || '')) {
      return {
        status: false,
        message: `El Grupo no se ha especificado correctamente`,
        group: null
      };
    }
    const objectUpdate = {
      description: group?.description,
      slug: slugify(group?.description || '', { lower: true }),
      order: group?.order
    };
    // Conocer el id del grupo
    const filter = { id: group?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'grupos');
    return {
      status: result.status,
      message: result.message,
      group: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Grupo no se ha especificado correctamente.`,
        group: null
      };
    }
    const result = await this.del(this.collection, { id }, 'grupo');
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
        message: `El ID del Grupo no se ha especificado correctamente.`,
        group: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'grupo');
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
      description: value
    });
  }
}

export default GroupsService;