import enviroment from './environments';

if (process.env.NODE_ENV !== 'production') {
  const env = enviroment;
}

export const SECRET_KEY =
  process.env.SECRET || 'hosting3m-ecommerce-09Fj1973';

export enum COLLECTIONS {
  USERS = 'users',
  BRANDS = 'brands',
  MODELS = 'models',
  CATEGORIES = 'categories',
  SUBCATEGORIES = 'subcategories',
  TAGS = 'tags',
  GROUPS = 'groups',
  CLIENTS = 'clients',
  SUPPLIERS = 'suppliers',
  BRANCH_OFFICES = 'branch_offices',
  PRODUCTS = 'products',
  COUNTRY = 'countrys',
  CPS = 'cps',
  APIPROVEEDORES = 'apiproveedores',
  SHOP_PRODUCTS = 'products_platforms',
  VIEW_SHOP_PRODUCTS = 'view_shop_products',
  BUDGETS = 'budgets',
  BUDGET_PRODUCTS = 'budgets_products',
  VIEW_BUDGET_PRODUCTS = 'view_budgets_products',
  ORDERS = 'orders',
  CONFIG = 'config'
}

export enum MESSAGES {
  TOKEN_VERICATION_FAILED = 'token no valido, inicia sesion de nuevo'
}

/**
 * H = Horas
 * M = Minutos
 * D = Dias
 */

export enum EXPIRETIME {
  H1 = 60 * 60,
  H24 = 24 * H1,
  M15 = H1 / 4,
  M20 = H1 / 3,
  M30 = H1 / 2,
  D3 = H24 * 3
}

export enum ACTIVE_VALUES_FILTER {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum SUBSCRIPTIONS_EVENT {
  UPDATE_STOCK_PRODUCT = 'UPDATE_STOCK_PRODUCT'
}