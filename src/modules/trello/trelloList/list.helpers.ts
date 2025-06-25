import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export function useCheckListInTrello() {
    return async function (
        req: FastifyRequest<{ Params: { trelloId: number; listId: number } }>,
        res: FastifyReply
    ) {
        const trelloId = Number(req.params.trelloId);
        const listId = Number(req.params.listId);

        if (!trelloId || !listId) {
            return res.apiResponse(500, { error: 'Paramètres invalides' });
        }

        try {
            const list = await prisma.trelloList.findFirst({
                where: {
                    id: listId,
                    trelloId: trelloId,
                },
            });

            if (!list) {
                return res.apiResponse(500, { error: 'Liste non trouvée dans ce board' });
            }
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la vérification de la liste' });
        }
    };
}
