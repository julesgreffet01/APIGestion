import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import StatutController from "./statut.controller";

const statutRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const statutController = new StatutController()
    fastify.get('/', statutController.getAll)
}

export default statutRoutes;