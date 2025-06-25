import {FastifyPluginAsync, FastifyInstance} from 'fastify'
import ListController from "./list.controller";
import {useRequireRole} from '../../../hooks/droits'
import {useCheckListInTrello} from "./list.helpers";

const listRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const listController = new ListController()
    fastify.post<{ Params: { trelloId: number }; Body: { name: string }; }>('/', {preHandler: useRequireRole(['Admin'])}, listController.create)
    fastify.put<{ Params: { trelloId: number; listId: number }; Body: { name: string }; }>('/:listId', {preHandler: [useRequireRole(['Admin']), useCheckListInTrello()]}, listController.update)
    fastify.put<{ Params: { trelloId: number}, Body: {orderedlistIds: number[]} }>('/reorder', {preHandler: useRequireRole(['Admin'])}, listController.reorder)
    fastify.delete<{ Params: { trelloId: number; listId: number } }>('/:listId', {preHandler: [useRequireRole(['Admin']), useCheckListInTrello()]}, listController.delete)
}
export default listRoutes;