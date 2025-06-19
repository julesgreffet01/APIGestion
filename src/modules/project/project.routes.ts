import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import ProjectController from "./project.controller";
import {useVerifyToken} from '../../hooks/droits'

const projectRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const projectController = new ProjectController();
    fastify.addHook('preHandler', useVerifyToken());
}

export default projectRoutes;