import {FastifyRequest, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {isStrictValidDate} from '../../../utils/date'

const prisma = new PrismaClient();

export default class CardController {
    async create(req: FastifyRequest<{ Params: { listId: number }; Body: { name: string; description?: string; userIds?: number[]; realDate?: string; }; }>,res: FastifyReply) {
        const listId = Number(req.params.listId);
        const { name, description, userIds, realDate } = req.body;
        if (!listId || !name || name.trim().length === 0) {
            return res.apiResponse(401, { error: 'Paramètres invalides' });
        }
        try {
            const list = await prisma.trelloList.findUnique({
                where: { id: listId },
                include: {
                    trello: { select: { projectId: true } },
                },
            });
            if (!list) return res.apiResponse(404, { message: 'Liste introuvable' });
            const projectId = list.trello.projectId;
            if (userIds && userIds.length > 0) {
                const validUsers = await prisma.userProject.findMany({
                    where: {
                        userId: { in: userIds },
                        projectId,
                    },
                    select: { userId: true },
                });

                const validUserIds = validUsers.map((u) => u.userId);
                if (validUserIds.length !== userIds.length) {
                    return res.apiResponse(400, {
                        message: 'Certains utilisateurs ne sont pas membres du projet !',
                    });
                }
            }
            const lastCard = await prisma.trelloCard.findFirst({
                where: { listId },
                orderBy: { position: 'desc' },
                select: { position: true },
            });

            const nextPosition = lastCard ? lastCard.position + 1 : 1;


            const newCard = await prisma.trelloCard.create({
                data: {
                    name,
                    description: description || '',
                    realDate: realDate && isStrictValidDate(realDate) ? new Date(realDate) : new Date(),
                    position: nextPosition,
                    listId,
                    // @ts-ignore
                    realisatorId: null,
                },
            });

            // Ajout des utilisateurs affectés à la carte
            if (userIds && userIds.length > 0) {
                await prisma.trelloCardUser.createMany({
                    data: userIds.map((userId) => ({
                        userId,
                        cardId: newCard.id,
                    })),
                    skipDuplicates: true,
                });
            }

            return res.apiResponse(201, newCard);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: 'Erreur lors de la création de la carte' });
        }
    }

    async update(req: FastifyRequest<{ Params: { cardId: number }; Body: { name?: string; realDate?: string; description?: string } }>, res: FastifyReply) {
        const cardId = Number(req.params.cardId);
        const { name, realDate, description } = req.body;
        if (!cardId) {
            return res.apiResponse(401, { message: "ID de carte invalide." });
        }
        const data: any = {};
        if (name !== undefined) data.name = name.trim();
        if (description !== undefined) data.description = description.trim();
        if (realDate !== undefined && isStrictValidDate(realDate)) {
            data.realDate = new Date(realDate);
        }
        if (Object.keys(data).length === 0) {
            return res.apiResponse(400, { message: "Aucune donnée à mettre à jour." });
        }
        try {
            await prisma.trelloCard.update({
                where: { id: cardId },
                data
            });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500, { error: "Erreur lors de la mise à jour de la carte." });
        }
    }

    async delete(req: FastifyRequest<{ Params: { cardId: number } }>, res: FastifyReply) {
        const cardId = Number(req.params.cardId);
        if (!cardId) return res.apiResponse(401);
        try {
            await prisma.trelloCardUser.deleteMany({
                where: { cardId },
            });
            await prisma.trelloCard.delete({
                where: { id: cardId },
            });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async reorder(req: FastifyRequest<{ Params: { cardId: number }; Body: { listId: number; newPosition: number }; }>, res: FastifyReply) {
        const cardId = Number(req.params.cardId);
        const { listId, newPosition } = req.body;

        if (!listId || isNaN(newPosition) || isNaN(cardId)) {
            return res.apiResponse(400, '1');
        }

        try {
            const card = await prisma.trelloCard.findUniqueOrThrow({ where: { id: cardId } });

            const fromListId = card.listId;
            const fromPosition = card.position;
            const toListId = listId;
            const isSameList = fromListId === toListId;
            await prisma.$transaction(async (tx) => {
                if (isSameList) {
                    if (newPosition === fromPosition) return;
                    if (newPosition < fromPosition) {
                        await tx.trelloCard.updateMany({
                            where: {
                                listId: fromListId,
                                position: { gte: newPosition, lt: fromPosition },
                            },
                            data: { position: { increment: 1 } },
                        });
                    } else {
                        await tx.trelloCard.updateMany({
                            where: {
                                listId: fromListId,
                                position: { gt: fromPosition, lte: newPosition },
                            },
                            data: { position: { decrement: 1 } },
                        });
                    }
                    await tx.trelloCard.update({
                        where: { id: cardId },
                        data: {
                            position: newPosition,
                        },
                    });
                } else {
                    await tx.trelloCard.updateMany({
                        where: {
                            listId: fromListId,
                            position: { gt: fromPosition },
                        },
                        data: { position: { decrement: 1 } },
                    });
                    await tx.trelloCard.updateMany({
                        where: {
                            listId: toListId,
                            position: { gte: newPosition },
                        },
                        data: { position: { increment: 1 } },
                    });
                    await tx.trelloCard.update({
                        where: { id: cardId },
                        data: {
                            listId: toListId,
                            position: newPosition,
                        },
                    });
                }
            });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async realised(req: FastifyRequest<{Params: {cardId: number}}>, res: FastifyReply) {
        const cardId = Number(req.params.cardId);
        const userId = req.user?.userId;
        if (isNaN(cardId) || !userId) return res.apiResponse(401);
        try {
            await prisma.trelloCard.update({
                where: {
                    id: cardId,
                },
                data: {
                    realised: true,
                    statutId: 3,
                    realisatorId: userId,
                }
            })
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

}