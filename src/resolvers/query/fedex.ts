import { IResolvers } from "@graphql-tools/utils";
import FedExService from "../../services/fedex.service";

const resolversFedexQuery: IResolvers = {
  Query: {
    async tokenFedex(_, __, context) {
      return new FedExService(_, __, context).getTokenFedex();
    },
    async transitTimesFedex(_, { shipmentFedex }, context) {
      return new FedExService(_, { shipmentFedex }, context).getTransitTimes();
    },
    // async packageAndServiceOptionsFedex(_, args, context) {
    //   return new FedExService(_, args, context).getPackageAndServiceOptions(args.input);
    // },
    // async specialServiceOptionsFedex(_, args, context) {
    //   return new FedExService(_, args, context).getSpecialServiceOptions(args.input);
    // },
  },
};

export default resolversFedexQuery;
