import BBVAService from "../../services/bbva.service";

const bbvaResolvers = {
  Query: {
    payment: async (_source: any, { id }: { id: string }, { dataSources }: { dataSources: { bbvaService: BBVAService } }) => {
      return await dataSources.bbvaService.getPayment(id);
    },
  },
};

export default bbvaResolvers;
