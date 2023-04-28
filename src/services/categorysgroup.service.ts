import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { findElementsCategorysGroup } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class CategoryGroupsService extends ResolversOperationsService {
  collection = COLLECTIONS.PRODUCTS;
  catalogName = 'Marcas';

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion de Marcas
  async items() {
    const result: Array<object> = await findElementsCategorysGroup(
      this.getDB(),
      this.collection,
    );
    if (result.length === 0) {
      return {
        status: false,
        message: 'La informacion que hemos pedido no se ha obtenido tal y como se esperaba',
        categorysgroups: []
      };
    }
    return {
      status: true,
      message: 'La informacion que hemos pedido se ha cargado correctamente',
      categorysgroups: result
    };
  }

}

export default CategoryGroupsService;