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
        message: 'Lo sentimos, no se puede cargar los datos del importe por proveedor en el Gráfico.',
        importBySupplier: null
      };
    }
  }

  async getImportBySupplierByMonth() {
    const year = this.getVariables().year;
    const month = this.getVariables().month;
    const supplierId = this.getVariables().supplierId;
    try {
      const result = await this.importBySupplierByMonthDashboar(this.collection, year, month, supplierId);
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

  async getImportBySupplierByWeek() {
    const supplierId = this.getVariables().supplierId;
    const weekNumber = this.getVariables().weekNumber;
    try {
      const result = await this.importBySupplierByWeekDashboar(this.collection, supplierId, weekNumber);
      return {
        status: result.status,
        message: result.message,
        importBySupplierByWeek: result.items
      };        
    } catch (error) {
      return await {
        status: false,
        message: 'Error en la carga del importe mensual por proveedor.',
        importBySupplierByWeek: null
      };
    }
  }

}

export default DashboardsService;