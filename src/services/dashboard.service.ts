import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

class DashboardsService extends ResolversOperationsService {
  collection = COLLECTIONS.DELIVERYS;
  catalogName = 'Ventas';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async getImportBySupplier() {
    try {
      const supplierId = this.getVariables().supplierId;
      const result = await this.importBySupplierDashboar(this.collection, supplierId);
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
    const supplierId = this.getVariables().supplierId;
    try {
      const result = await this.importBySupplierByMonthDashboar(this.collection, supplierId);
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