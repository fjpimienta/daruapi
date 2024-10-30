import ResolversOperationsService from './resolvers-operaciones.service';
import { IContextData } from '../interfaces/context-data.interface';
import { Especificacion } from '../models/product.models';

// Define la interfaz Attribute si no está definida
interface Attribute {
  headerName: string;
  attributeName: string;
  attributeValue: string;
}

class TraslateService extends ResolversOperationsService {
  private static traducciones: { [key: string]: string } = {
    'Display Size': 'Tamaño de pantalla',
    'Panel Type': 'Tipo de panel',
    'Aspect Ratio': 'Relación de aspecto',
    'Display Orientation': 'Orientación de pantalla',
    'Resolution': 'Resolución',
    'Refresh Rate': 'Frecuencia de actualización',
    'Bit Depth / Color Support': 'Profundidad de color / Soporte de color',
    'Pixels Per Inch (ppi)': 'Píxeles por pulgada (ppi)',
    'Finish': 'Acabado',
    'Touchscreen Technology': 'Tecnología de pantalla táctil',
    'Multi-Touch Points': 'Puntos multi-táctiles',
    'TV Tuner': 'Sintonizador de TV',
    'Inputs': 'Entradas',
    'Outputs': 'Salidas',
    'Wireless': 'Conectividad inalámbrica',
    'USB I/O': 'Entradas/Salidas USB',
    'Ethernet I/O': 'Entradas/Salidas Ethernet',
    'Built-In Speakers': 'Altavoces incorporados',
    'Speaker Configuration': 'Configuración de altavoces',
    'Processor': 'Procesador',
    'Storage': 'Almacenamiento',
    'RAM': 'Memoria RAM',
    'OS Compatibility': 'Compatibilidad del sistema operativo',
    'Mobile App Compatible': 'Compatibilidad con la aplicación móvil',
    'Media Card Reader': 'Lector de tarjetas de memoria',
    'Built-In Mic': 'Micrófono incorporado',
    'Webcam': 'Cámara web',
    'Material of Construction': 'Material de construcción',
    'IK Rating': 'Calificación IK',
    'Bezel Thickness': 'Grosor del bisel',
    'Dimensions': 'Dimensiones',
    'Weight': 'Peso',
    'Package Weight': 'Peso del paquete',
    'Box Dimensions (LxWxH)': 'Dimensiones de la caja (LxWxH)'
  };

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  private homologarTipo(tipo: string): string {
    return TraslateService.traducciones[tipo] || tipo;
  }

  public homologarTipos(listaProductos: Especificacion[][]): Especificacion[][] {
    return listaProductos.map(producto =>
      producto.map(especificacion => ({
        agrupadoPor: especificacion.agrupadoPor,
        tipo: this.homologarTipo(especificacion.tipo),
        valor: especificacion.valor
      }))
    );
  }

  // Función para obtener el JSON desde una URL y procesarlo
  async fetchAndProcessJson(url: string): Promise<Especificacion[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al obtener el JSON: ${response.statusText}`);
      }
      const data: Attribute[] = await response.json();
      return this.generateOutput(data);
    } catch (error) {
      console.error('Error al procesar el JSON:', error);
      return [];
    }
  }

  // Función para generar la salida con los datos obtenidos
  private generateOutput(data: Attribute[]): Especificacion[] {
    return data.map(item => ({
      agrupadoPor: item.headerName,
      tipo: item.attributeName,
      valor: item.attributeValue
    }));
  }
}

export default TraslateService;
