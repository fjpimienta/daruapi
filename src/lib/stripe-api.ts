export const STRIPE_OBJECTS = {
  CHARGES: 'charges',
  CUSTOMERS: 'customers',
  TOKENS: 'tokens'
};

export const STRIPE_ACTIONS = {
  CREATE: 'create',
  CREATE_SOURCE: 'createSource',
  GET: 'retrieve',
  GET_SOURCE: 'retrieveSource',
  UPDATE: 'update',
  UPDATE_SOURCE: 'updateSource',
  DELETE: 'del',
  DELETE_SOURCE: 'deleteSource',
  LIST: 'list',
  LIST_SOURCE: 'listSources'
};

class StripeApi {
  private stripe = require('stripe')(process.env.STRIPE_API_KEY, {
    apiVersion: process.env.STRIPE_API_VERSION
  });

  async execute(object: string, action: string, ...args: [
    (string | object), (string | object)?, (string | object)?
  ]) {
    return await this.stripe[object][action](...args);
  }

  protected async getError(error: Error) {
    return {
      status: false,
      message: `Error: `.concat(error.message),
      hasMore: false,
      customer: undefined,
      card: undefined,
      cards: undefined
    };
  }

  protected getPagination(startingAfter: string, endingBefore: string) {
    let pagination;
    if (startingAfter !== '' && endingBefore === '') {
      pagination = { starting_after: startingAfter };
    } else if (startingAfter === '' && endingBefore !== '') {
      pagination = { ending_before: endingBefore };
    } else {
      pagination = {};
    }
    return pagination;
  }
}

export default StripeApi;