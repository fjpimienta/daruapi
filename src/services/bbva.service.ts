import { DataSource } from 'apollo-datasource';

class BBVAService extends DataSource {
  baseURL = 'https://apis.bbva.com/payments/v1/'; // Reemplaza con la URL base real de la API de BBVA

  constructor() {
    super();
  }

  async willSendRequest(_requestContext: any) {
    // Establecer headers para la autenticación (reemplaza con tu clave de API real)
    _requestContext.request.headers.set('X-Api-Key', 'YOUR_BBVA_API_KEY');
    _requestContext.request.headers.set('Content-Type', 'application/json');
  }

  async getPayment(id: string) {
    return this.get(`payments/${id}`);
  }

  async createPayment(paymentInput: any) {
    return this.post('payments', { body: paymentInput });
  }

  async cancelPayment(id: string) {
    return this.delete(`payments/${id}`);
  }

  async get(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': 'YOUR_BBVA_API_KEY',
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-Api-Key': 'YOUR_BBVA_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'X-Api-Key': 'YOUR_BBVA_API_KEY',
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
}

export default BBVAService;
