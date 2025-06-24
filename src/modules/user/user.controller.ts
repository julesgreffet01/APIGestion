import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt'
import {normalizeEmail} from "../../utils/email";
import {searchUserItems} from "./user.helpers";

const prisma = new PrismaClient()
export default class UserController {

    async updateUser(req: FastifyRequest<{Body: {email?: string, password?: string, name?: string, firstName?: string}}>, res: FastifyReply) {
        const { email, password, name, firstName } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.apiResponse(401, 'Non autorisé' );
        }
        const dataToUpdate: Record<string, any> = {};

        if (email !== undefined) dataToUpdate.email = normalizeEmail(email);
        if (password !== undefined) dataToUpdate.password = await bcrypt.hash(password, 10);
        if (name !== undefined) dataToUpdate.name = name;
        if (firstName !== undefined) dataToUpdate.firstName = firstName;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.apiResponse(401,'Aucune donnée à mettre à jour' );
        }
        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: dataToUpdate,
                select: {name: true, firstName: true, email: true}
            });
            return res.apiResponse(200, updatedUser);
        } catch (error) {
            console.error(error);
            return res.apiResponse(400);
        }
    }

    async find(req: FastifyRequest, res: FastifyReply) {
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(401);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {name: true, firstName: true, email: true}}
        );
        if (!user) return res.apiResponse(401);
        return res.apiResponse(200, user);
    }

    async progressed(req: FastifyRequest, res: FastifyReply) {
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(401);
        const completedStatut = await prisma.statut.findFirst({
            where: { libelle: 'complété' }
        });

        if (!completedStatut) throw new Error("Statut 'Complété' non trouvé");
        const statutId = completedStatut.id;

        const [trelloCards, todoTasks, ganttTasks] = await Promise.all([
            prisma.trelloCard.findMany({
                where: {
                    statutId,
                    users: { some: { userId } }
                },
                select: { realDate: true }
            }),
            prisma.toDoTask.findMany({
                where: {
                    statutId,
                    users: { some: { userId } }
                },
                select: { realDate: true }
            }),
            prisma.ganttActivity.findMany({
                where: {
                    statutId,
                    users: { some: { userId } }
                },
                select: { startDate: true } // ou `realDate` si tu en ajoutes un jour
            })
        ]);

        const allDates = [
            ...trelloCards.map(t => t.realDate),
            ...todoTasks.map(t => t.realDate),
            ...ganttTasks.map(t => t.startDate)
        ];
        const result: { [key: string]: number } = {};

        const validDates = allDates.filter((d): d is Date => d !== null);

        for (const date of validDates) {
            const d = new Date(date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            if (!result[key]) {
                result[key] = 0;
            }

            result[key]++;
        }

        return result;
    }

    async searchBarre(req: FastifyRequest<{Params: {search: string}}>, res: FastifyReply) {
        try {
            const { search } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).send({ error: 'Utilisateur non authentifié' });
            }

            if (!search || search.trim().length === 0) {
                return res.status(400).send({ error: 'Terme de recherche requis' });
            }

            const results = await searchUserItems(userId, search.trim());

            return res.send({
                success: true,
                searchTerm: search,
                results
            });

        } catch (error) {
            console.error('Erreur dans searchBarre:', error);
            return res.status(500).send({
                success: false,
                error: 'Erreur interne du serveur'
            });
        }
    }

    async getAllNoInProject(req: FastifyRequest<{ Params: { projectId: number } }>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        if (!projectId) return res.apiResponse(401, 'Project ID manquant');
        try {
            const users = await prisma.user.findMany({
                where: {
                    userProjects: {
                        none: {
                            projectId: projectId,
                        },
                    },
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    firstName: true,
                    photo: true,
                },
            });
            return res.apiResponse(200, users);
        } catch (error) {
            console.error(error);
            return res.apiResponse(500);
        }
    }

    async getAllInProject(req: FastifyRequest<{Params: {projectId: number}}>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        if(!projectId) return res.apiResponse(401);
        try {
            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                }
            })
            if(!project) return res.apiResponse(401);
            const users = await prisma.userProject.findMany({
                where: {
                    projectId,
                },
                select: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            firstName: true,
                            email: true,
                            photo: true,
                        }
                    }
                }
            });
            return res.apiResponse(200, users);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}