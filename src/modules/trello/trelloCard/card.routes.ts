import {FastifyPluginAsync, FastifyInstance} from 'fastify'
import CardController from "./card.controller";
import {useRequireRole} from '../../../hooks/droits'
import {useCheckCardInList} from "./card.helpers";

const cardRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const cardController = new CardController()
    fastify.post<{ Params: { listId: number }; Body: { name: string; description?: string; userIds?: number[]; realDate?: string; }; }>('/',{preHandler: useRequireRole(['Admin'])}, cardController.create)
    fastify.put<{ Params: { cardId: number, listId: number }; Body: { name?: string; realDate?: string; description?: string } }>('/:cardId',{preHandler: [useRequireRole(['Admin']), useCheckCardInList()]}, cardController.update)
    fastify.put<{ Params: { cardId: number, listId: number }; Body: { listId: number; newPosition: number }; }>('/reorder/:cardId',{preHandler: [useRequireRole(['Admin']), useCheckCardInList()]}, cardController.reorder)
    fastify.put<{Params: {cardId: number, listId: number}}>('/realised/:cardId', {preHandler: [useRequireRole(['Admin']), useCheckCardInList()]}, cardController.realised)
    fastify.delete<{ Params: { cardId: number, listId: number } }>('/:cardId',{preHandler: [useRequireRole(['Admin']), useCheckCardInList()]}, cardController.delete)
}

export default cardRoutes;

