import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import fetch from 'node-fetch';

class ExternalIcommktsService extends ResolversOperationsService {
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async getIcommktContacts() {
    try {
      const ProfileKey = 'ODkzMjQ20';
      const Authorization = 'MjU0NC04MzQxLWRhcnVteF91c3I1';
      const apiUrl = 'https://api.icommarketing.com/Contacts/ListFull.Json/';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': Authorization
        },
        body: JSON.stringify({
          "ProfileKey": ProfileKey,
          "Filters": {}
        })
      };
      const result = await fetch(apiUrl, options);
      const data = await result.json();
      if (result.ok) {
        return {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          icommktContacts: data.ListContactsFullJsonResult
        };
      }
      return {
        status: false,
        message: 'Error en el servicio. ' + data.code + ': ' + data.message,
        coverage: null
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        icecatProduct: null,
      };
    }
  }

  async getIcommktContact(variables: IVariables) {
    try {
      const Email = variables.email;
      const ProfileKey = 'ODkzMjQ20';
      const Authorization = 'MjU0NC04MzQxLWRhcnVteF91c3I1';
      const apiUrl = 'https://api.icommarketing.com/Contacts/ListFull.Json/';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': Authorization
        },
        body: JSON.stringify({
          "ProfileKey": ProfileKey,
          "Filters": {
            "Email": Email
          }
        })
      };
      const result = await fetch(apiUrl, options);
      const data = await result.json();
      if (result.ok) {
        return {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          icommktContact: data.ListContactsFullJsonResult[0]
        };
      }
      return {
        status: false,
        message: 'Error en el servicio. ' + data.code + ': ' + data.message,
        coverage: null
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        icecatProduct: null,
      };
    }
  }

  async setAddContact(variables: IVariables) {
    try {
      const { icommkContactInput } = variables;
      const ProfileKey = 'ODkzMjQ20';
      const Authorization = 'MjU0NC04MzQxLWRhcnVteF91c3I1';
      const apiUrl = 'https://api.icommarketing.com/Contacts/SaveContact.Json/';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': Authorization
        },
        body: JSON.stringify({
          "ProfileKey": ProfileKey,
          "Contact": icommkContactInput
        })
      };
      const result = await fetch(apiUrl, options);
      console.log('result: ', result);
      const data = await result.json();
      console.log('data: ', data);
      if (result.ok) {
        if (data.SaveContactJsonResult.StatusCode === 1) {
          return {
            status: true,
            message: `El Contacto ${icommkContactInput?.Email} se ha agregado correctamente.`,
            addContact: data.SaveContactJsonResult.Data
          };
        }
        return {
          status: false,
          message: `El Contacto ${icommkContactInput?.Email} no se ha agregado. Validar contacto.`,
          addContact: data.SaveContactJsonResult.Data
        };
      }
      return {
        status: false,
        message: 'Error en el servicio. ' + data.code + ': ' + data.message,
        addContact: null
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        addContact: null,
      };
    }
  }

  async setUpdateContact(variables: IVariables) {
    try {
      const { icommkContactInputs } = variables;
      const ProfileKey = 'ODkzMjQ20';
      const Authorization = 'MjU0NC04MzQxLWRhcnVteF91c3I1';
      const apiUrl = 'https://api.icommarketing.com/Contacts/SaveMultiContact.Json/';
      if (icommkContactInputs && icommkContactInputs?.length > 0) {
        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': Authorization
          },
          body: JSON.stringify({
            "ProfileKey": ProfileKey,
            "ContactList": icommkContactInputs
          })
        };
        const icommkContactInput = icommkContactInputs[0];
        const result = await fetch(apiUrl, options);
        const data = await result.json();
        if (result.ok) {
          if (data.SaveMultiContactJsonResult.StatusCode === 1 && data.SaveMultiContactJsonResult.Responses[0].StatusCode === 1) {
            return {
              status: true,
              message: `El Contacto ${icommkContactInput.Email} se ha actualizado correctamente.`,
              updateContact: data.SaveMultiContactJsonResult.Responses[0]
            };
          }
          return {
            status: false,
            message: `El Contacto ${icommkContactInput.Email} no se ha actualizado. Validar contacto.`,
            updateContact: data.SaveMultiContactJsonResult.Responses
          };
        }

      }
      return {
        status: false,
        message: 'No hay datos que actualizar.',
        updateContact: null
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        addContact: null,
      };
    }
  }

  async setRemoveContact(variables: IVariables) {
    try {
      const { email } = variables;
      const ProfileKey = 'ODkzMjQ20';
      const Authorization = 'MjU0NC04MzQxLWRhcnVteF91c3I1';
      const apiUrl = 'https://api.icommarketing.com/Contacts/RemoveContact.Json/';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': Authorization
        },
        body: JSON.stringify({
          "ProfileKey": ProfileKey,
          "Contact": {
            "Email": email
          }
        })
      };
      console.log('options: ', options);
      const result = await fetch(apiUrl, options);
      console.log('result: ', result);
      const data = await result.json();
      console.log('data: ', data);
      if (result.ok) {
        if (data.RemoveContactJsonResult.StatusCode === 2) {
          return {
            status: true,
            message: `El Contacto ${email} se ha eliminado correctamente.`,
            removeContact: data.RemoveContactJsonResult.Data
          };
        } else if (data.RemoveContactJsonResult.StatusCode === 101) {
          return {
            status: false,
            message: `El Contacto ${email} no se encuentra. Validar contacto.`,
            removeContact: data.RemoveContactJsonResult.Data
          };
        }
        return {
          status: false,
          message: `El Contacto ${email} no se ha eliminado. Validar contacto.`,
          removeContact: data.RemoveContactJsonResult.Data
        };
      }
      return {
        status: false,
        message: 'Error en el servicio. ' + data.code + ': ' + data.message,
        removeContact: null
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        addContact: null,
      };
    }
  }

  async setUnsubscribeContact() {

  }

  async setActiveContact() {

  }
}

export default ExternalIcommktsService;