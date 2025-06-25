import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyReply} from "fastify";

const prisma = new PrismaClient();

export function useCheckTrelloInProject() {
    return async function (
        req: FastifyRequest<{ Params: { projectId: number; trelloId: number } }>,
        res: FastifyReply
    ) {
        const projectId = Number(req.params.projectId);
        const trelloId  = Number(req.params.trelloId);
        if (!projectId || !trelloId) {
            return res.apiResponse(500, { error: 'paramètres invalides' });
        }
        try {
            const board = await prisma.trello.findFirst({
                where: {
                    id:        trelloId,
                    projectId: projectId
                }
            });
            if (!board) {
                return res.apiResponse(500, { error: 'Trello non trouvé dans ce projet' });
            }
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur serveur' });
        }
    };
}