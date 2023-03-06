import { IResolvers } from '@graphql-tools/utils';
import ShopProductsService from '../../services/shop-products.service';

const resolversShopProductMutation: IResolvers = {
   Mutation: {
      updateStock(_, { update }, { db, pubsub }) {
         return new ShopProductsService(_, {}, { db }).updateStock(update, pubsub);
      },
      addShopProduct(_, { shopProduct }, context) {
         return new ShopProductsService(_, { shopProduct }, context).insert();
      },
      updateShopProduct(_, { shopProduct }, context) {
         return new ShopProductsService(_, { shopProduct }, context).modify();
      },
      deleteShopProduct(_, variables, context) {
         return new ShopProductsService(_, variables, context).delete();
      },
      blockShopProduct(_, { id, unblock, admin }, context) {
         return new ShopProductsService(_, { id }, context).unblock(unblock, admin);
      }
   }
};

export default resolversShopProductMutation;