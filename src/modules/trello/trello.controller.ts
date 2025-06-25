import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient()

export default class TrelloController {
    async getAllByProject(req: FastifyRequest<{Params: {projectId: number}}>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        if (!projectId) {
            return res.apiResponse(401, { error: 'ProjectId invalide' });
        }

        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });
            if (!project) {
                return res.apiResponse(401, { error: 'Projet introuvable' });
            }

            const boards = await prisma.trello.findMany({
                where: { projectId },
                include: {
                    lists: {
                        include: {
                            cards: {
                                select: {
                                    statutId: true,    // ou realised: true si tu préfères
                                },
                            },
                        },
                    },
                },
            });

            const boardsWithCounts = boards.map((board) => {
                let totalCards = 0;
                let completedCards = 0;

                board.lists.forEach((list) => {
                    list.cards.forEach((card) => {
                        totalCards++;
                        if (card.statutId === 3) {
                            completedCards++;
                        }
                    });
                });

                return {
                    id: board.id,
                    name: board.name,
                    projectId: board.projectId,
                    cardCompleted: completedCards,
                    cardGlobal: totalCards,
                };
            });
            return res.apiResponse(200, boardsWithCounts);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur interne' });
        }
    }

    async find(req: FastifyRequest<{Params: {trelloId: number}}>, res: FastifyReply) {
        const trelloId = Number(req.params.trelloId);
        if (!trelloId) {
            return res.apiResponse(400, { error: 'Paramètre trelloId invalide' });
        }
        try {
            const board = await prisma.trello.findUnique({
                where: { id: trelloId },
                include: {
                    lists: {
                        orderBy: { position: 'asc' },
                        include: {
                            cards: {
                                orderBy: { position: 'asc' },
                                include: {
                                    realisator: true,
                                    statut:    true,
                                    users: {
                                        include: { user: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!board) {
                return res.apiResponse(404, { error: 'Trello introuvable' });
            }

            return res.apiResponse(200, board);
        } catch (err) {
            console.error(err);
            return res.apiResponse(500, { error: 'Erreur serveur' });
        }
    }

    async create(req: FastifyRequest<{ Params: { projectId: number }; Body: { name: string } }>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        const name = req.body.name;
        if (!projectId || !name.trim().length) {
            return res.apiResponse(401, { error: 'projectId ou name invalide' });
        }
        try {
            await prisma.trello.create({
                data: { name, projectId },
            });
            return res.apiResponse(201);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la création du board' });
        }
    }

    async update(req: FastifyRequest<{ Params: { trelloId: number }; Body: { name: string } }>, res: FastifyReply) {
        const trelloId = Number(req.params.trelloId);
        const name = req.body.name;
        if (!trelloId || !name.trim().length) {
            return res.apiResponse(401, { error: 'trelloId ou name invalide' });
        }
        try {
            await prisma.trello.findUniqueOrThrow({ where: { id: trelloId } });
            await prisma.trello.update({
                where: { id: trelloId },
                data: { name },
            });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la mise à jour du board' });
        }
    }

    async delete(req: FastifyRequest<{ Params: { trelloId: number } }>, res: FastifyReply) {
        const trelloId = Number(req.params.trelloId);
        if (!trelloId) {
            return res.apiResponse(401, { error: 'trelloId invalide' });
        }
        try {
            await prisma.trello.delete({ where: { id: trelloId } });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la suppression du board' });
        }
    }
}