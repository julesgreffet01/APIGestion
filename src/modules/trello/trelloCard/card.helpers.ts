import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function useCheckCardInList() {
    return async function (
        req: FastifyRequest<{ Params: { listId: number; cardId: number } }>,
        res: FastifyReply
    ) {
        const listId = Number(req.params.listId);
        const cardId = Number(req.params.cardId);

        if (!listId || !cardId) {
            return res.apiResponse(500, { error: 'Paramètres invalides' });
        }

        try {
            const card = await prisma.trelloCard.findFirst({
                where: {
                    id: cardId,
                    listId: listId,
                },
                select: { id: true },
            });

            if (!card) {
                return res.apiResponse(500, { error: 'La carte ne correspond pas à la liste.' });
            }
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur serveur.' });
        }
    };
}
