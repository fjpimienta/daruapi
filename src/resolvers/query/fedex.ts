import { IResolvers } from "@graphql-tools/utils";
import FedExService from "../../services/fedex.service";

const resolversFedexQuery: IResolvers = {
  Query: {
    async tokenFedex(_, __, context) {
      return new FedExService(_, __, context).getTokenFedex();
    },
  },
};

export default resolversFedexQuery;
