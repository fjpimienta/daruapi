import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class DashboardsService extends ResolversOperationsService {
  collection = COLLECTIONS.DELIVERYS;
  catalogName = 'Ventas';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async getImportBySupplier() {
    try {
      const filter = {};
      const result = await this.importBySupplierDashboar(this.collection, filter);
      return {
        status: result.status,
        message: result.message,
        importBySupplier: result.items
      };        
    } catch (error) {
      return await {
        status: false,
        message: 'Error en la carga del importe por proveedor.',
        importBySupplier: null
      };
    }
  }

  async getImportBySupplierByMonth() {
    try {
      const filter = {};
      const result = await this.importBySupplierByMonthDashboar(this.collection, filter);
      return {
        status: result.status,
        message: result.message,
        importBySupplierByMonth: result.items
      };        
    } catch (error) {
      return await {
        status: false,
        message: 'Error en la carga del importe mensual por proveedor.',
        importBySupplierByMonth: null
      };
    }
  }

}

export default DashboardsService;