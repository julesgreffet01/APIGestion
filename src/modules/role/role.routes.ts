import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import RoleController from "./role.controller";

const roleRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const roleController = new RoleController();
    fastify.get('/', roleController.getAll)
}

export default roleRoutes;