import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt'
import {normalizeEmail} from "../../utils/email";

export default class UserController {
    prisma = new PrismaClient()
    async updateUser(req: FastifyRequest<{Body: {email: string, password: string, name: string, firstName: string}}>, res: FastifyReply) {
        const { email, password, name, firstName } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.apiResponse(401, 'Non autorisé' );
        }
        const dataToUpdate: Record<string, any> = {};

        if (email !== undefined) dataToUpdate.email = normalizeEmail(email);
        if (password !== undefined) dataToUpdate.password = bcrypt.hash(password, 10);
        if (name !== undefined) dataToUpdate.name = name;
        if (firstName !== undefined) dataToUpdate.firstName = firstName;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.apiResponse(401,'Aucune donnée à mettre à jour' );
        }

        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: dataToUpdate,
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
        const user = this.prisma.user.findUnique({where: { id: userId }})
        if (!user) return res.apiResponse(401);
        return res.apiResponse(200, user);
    }

    async progressed(req: FastifyRequest, res: FastifyReply) {
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(401);
        const completedStatut = await this.prisma.statut.findFirst({
            where: { libelle: 'completed' }
        });

        if (!completedStatut) throw new Error("Statut 'completed' non trouvé");
        const statutId = completedStatut.id;

        // Récupération de toutes les dates de réalisation
        const [trelloCards, todoTasks, ganttTasks] = await Promise.all([
            this.prisma.trelloCard.findMany({
                where: {
                    statutId,
                    users: { some: { userId } }
                },
                select: { realDate: true }
            }),
            this.prisma.toDoTask.findMany({
                where: {
                    statutId,
                    users: { some: { userId } }
                },
                select: { realDate: true }
            }),
            this.prisma.ganttActivity.findMany({
                where: {
                    statutId,
                    users: { some: { userId } }
                },
                select: { startDate: true } // ou `realDate` si tu en ajoutes un jour
            })
        ]);

        // Regroupement des dates dans un seul tableau
        const allDates = [
            ...trelloCards.map(t => t.realDate),
            ...todoTasks.map(t => t.realDate),
            ...ganttTasks.map(t => t.startDate)
        ];
        const result: { [key: string]: number } = {};

        for (const date of allDates) {
            const d = new Date(date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            if (!result[key]) {
                result[key] = 0;
            }

            result[key]++;
        }

        return result;
    }
}