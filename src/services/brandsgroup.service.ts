import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { findElementsBrandsGroup } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class BrandGroupsService extends ResolversOperationsService {
  collection = COLLECTIONS.PRODUCTS;
  catalogName = 'Marcas';

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion de Marcas
  async items() {
    const result: Array<object> = await findElementsBrandsGroup(
      this.getDB(),
      this.collection,
    );
    if (result.length === 0) {
      return {
        status: false,
        message: 'La informacion que hemos pedido no se ha obtenido tal y como se esperaba',
        brandsgroups: []
      };
    }
    return {
      status: true,
      message: 'La informacion que hemos pedido se ha cargado correctamente',
      brandsgroups: result
    };
  }

}

export default BrandGroupsService;