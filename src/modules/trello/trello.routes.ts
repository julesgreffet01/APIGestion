import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import TrelloController from "./trello.controller.js";
import {useRequireRole} from '../../hooks/droits.js'
import {useCheckTrelloInProject} from "./trello.helpers.js";
import listRoutes from "./trelloList/list.routes.js";

const trelloRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const trelloController = new TrelloController();

    fastify.get('/', trelloController.getAllByProject)
    fastify.get('/:trelloId',{preHandler: useCheckTrelloInProject()}, trelloController.find)
    fastify.post<{ Params: { projectId: number }; Body: { name: string } }>('/',{preHandler: useRequireRole(['Admin'])}, trelloController.create)
    fastify.put<{ Params: { trelloId: number, projectId: number }; Body: { name: string } }>('/:trelloId',{preHandler: [useCheckTrelloInProject(), useRequireRole(['Admin'])]}, trelloController.update)
    fastify.delete<{ Params: { trelloId: number, projectId: number } }>('/:trelloId',{preHandler: [useCheckTrelloInProject(), useRequireRole(['Admin'])]}, trelloController.delete)

    fastify.register(async function (projectScoped) {
        await projectScoped.register(listRoutes, { prefix: '/:trelloId/list' });
    });
}

export default trelloRoutes;