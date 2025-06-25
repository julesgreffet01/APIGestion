import {FastifyRequest, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export default class ListController {
    async create(req: FastifyRequest<{ Params: { trelloId: number }; Body: { name: string }; }>, res: FastifyReply) {
        const trelloId = Number(req.params.trelloId);
        const name = req.body.name;
        if (!trelloId || !name.trim().length) {
            return res.apiResponse(401, { error: 'trelloId ou name invalide' });
        }
        try {
            await prisma.trello.findUniqueOrThrow({ where: { id: trelloId } });
            const lastList = await prisma.trelloList.findFirst({
                where: { trelloId },
                orderBy: { position: 'desc' },
            });
            const nextPosition = lastList ? lastList.position + 1 : 0;
            await prisma.trelloList.create({
                data: { name, position: nextPosition, trelloId },
            });
            return res.apiResponse(201);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la création de la liste' });
        }
    }

    async update(req: FastifyRequest<{ Params: { trelloId: number; listId: number }; Body: { name: string }; }>, res: FastifyReply) {
        const trelloId = Number(req.params.trelloId);
        const listId = Number(req.params.listId);
        const name = req.body.name;

        if (!trelloId || !listId || !name.trim().length) {
            return res.apiResponse(401, { error: 'Paramètres invalides' });
        }

        try {
            const list = await prisma.trelloList.findUniqueOrThrow({ where: { id: listId } });

            if (list.trelloId !== trelloId) {
                return res.apiResponse(403, { error: 'Cette liste n’appartient pas à ce board' });
            }

            await prisma.trelloList.update({
                where: { id: listId },
                data: { name },
            });

            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la mise à jour de la liste' });
        }
    }

    async delete(req: FastifyRequest<{ Params: { trelloId: number; listId: number } }>, res: FastifyReply) {
        const trelloId = Number(req.params.trelloId);
        const listId = Number(req.params.listId);
        if (!trelloId || !listId) {
            return res.apiResponse(401, { error: 'Paramètres invalides' });
        }
        try {
            const list = await prisma.trelloList.findUniqueOrThrow({ where: { id: listId } });

            if (list.trelloId !== trelloId) {
                return res.apiResponse(403, { error: 'Cette liste n’appartient pas à ce board' });
            }

            await prisma.trelloList.delete({ where: { id: listId } });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la suppression de la liste' });
        }
    }

    async reorder(req: FastifyRequest<{ Params: { trelloId: number}, Body: {orderedlistIds: number[]} }>, res: FastifyReply) {
        const trelloId = Number(req.params.trelloId);
        const orderedListIds = req.body.orderedlistIds;
        if(!orderedListIds.length || isNaN(trelloId)) return res.apiResponse(400)
        try {
            const validlists = await prisma.trelloList.findMany({
                where: {
                    id: { in: orderedListIds },
                    trelloId
                },
                select: { id: true }
            });
            const validTaskIds = validlists.map(t => t.id);
            if(validTaskIds.length !== orderedListIds.length) return res.apiResponse(500);
            for (let index = 0; index < orderedListIds.length; index++) {
                const listId = orderedListIds[index];
                await prisma.trelloList.update({
                    where: { id: listId },
                    data: { position: index + 1 }
                });
            }
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}