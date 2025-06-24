import {FastifyRequest, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {isStrictValidDate} from './activity.helpers'

const prisma = new PrismaClient();
export default class ActivityController {
    async getAllByGantt(req: FastifyRequest<{ Params: { ganttId: number } }>, res: FastifyReply) {
        const ganttId = Number(req.params.ganttId);
        try {
            const activities = await prisma.ganttActivity.findMany({
                where: {ganttId},
                include: {
                    dependencies: {
                        select: {dependTaskId: true}
                    },
                    users: {
                        select: {
                            user: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            const ganttTasks = activities.map(activity => {
                const dependencyIds = activity.dependencies.map(dep => dep.dependTaskId.toString());
                const assignedUsers = activity.users.map(u => u.user.name);
                return {
                    id: activity.id.toString(),
                    name: activity.name,
                    start: activity.startDate.toISOString().split("T")[0],
                    end: activity.endDate.toISOString().split("T")[0],
                    progress: activity.progress,
                    dependencies: dependencyIds.join(","),
                    users: assignedUsers
                };
            });
            return res.send(ganttTasks);
        } catch (error) {
            console.error(error);
            return res.status(500).send({error: "Erreur lors de la récupération des tâches Gantt."});
        }
    }

    async create(req: FastifyRequest<{
        Body: {
            name: string,
            description: string,
            startDate: string,
            endDate: string,
            userIds?: number[],
            dependencesIds?: number[]
        },
        Params: { ganttId: number, projectId: number }
    }>, res: FastifyReply) {
        const ganttId = Number(req.params.ganttId);
        const projectId = Number(req.params.projectId);
        const {name, description, startDate, endDate, userIds, dependencesIds} = req.body;

        if (
            !name?.trim() ||
            !description?.trim() ||
            !startDate?.trim() ||
            !endDate?.trim()
        ) return res.apiResponse(400);

        if (!isStrictValidDate(startDate) || !isStrictValidDate(endDate)) return res.apiResponse(400, "dates");

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) return res.apiResponse(400, "ordre des dates");

        try {
            const gantt = await prisma.gantt.findUnique({where: {id: ganttId}});
            if (!gantt) return res.apiResponse(400, "pas de gantt");

            const userProjects = await prisma.userProject.findMany({
                where: { projectId },
                select: { userId: true }
            });
            const usersInProject = userProjects.map(up => up.userId);

            if (userIds && userIds.length > 0) {
                if(!userIds.every(id=>usersInProject.includes(id))) return res.apiResponse(400, "pas de users");
                const users = await prisma.user.findMany({
                    where: {id: {in: userIds}},
                    select: {id: true}
                });
                if (users.length !== userIds.length) return res.apiResponse(400, "pas de user");
            }
            if (dependencesIds && dependencesIds.length > 0) {
                const dependences = await prisma.ganttActivity.findMany({
                    where: {id: {in: dependencesIds}},
                    select: {id: true}
                });
                if (dependences.length !== dependencesIds.length) return res.apiResponse(400, "pas de dependances");
            }
            const activity = await prisma.ganttActivity.create({
                data: {
                    name,
                    description,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    ganttId,
                    progress: 0,
                    statutId: 1
                }
            });
            if (userIds && userIds.length > 0) {
                await prisma.ganttActivityUser.createMany({
                    data: userIds.map(userId => ({
                        userId,
                        taskId: activity.id
                    }))
                });
            }
            if (dependencesIds && dependencesIds.length > 0) {
                await prisma.ganttActivityAssignement.createMany({
                    data: dependencesIds.map(dependId => ({
                        taskId: activity.id,
                        dependTaskId: dependId
                    }))
                });
            }
            return res.apiResponse(201);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async update(req: FastifyRequest<{
        Body: {
            name?: string,
            description?: string,
            startDate?: string,
            endDate?: string,
            userIds?: number[],
            dependencesIds?: number[],
            progress: number
        },
        Params: { ganttId: number, activityId: number, projectId: number }
    }>, res: FastifyReply) {
        const activityId = Number(req.params.activityId);
        const projectId = Number(req.params.projectId);
        const {
            name,
            description,
            startDate,
            endDate,
            progress,
            userIds,
            dependencesIds
        } = req.body;

        if (!activityId) return res.apiResponse(400);

        const updateData: any = {};

        if (typeof name === 'string' && name.trim().length > 0) updateData.name = name;
        if (typeof description === 'string' && description.trim().length > 0) updateData.description = description;
        if (typeof startDate === 'string' && isStrictValidDate(startDate)) updateData.startDate = new Date(startDate);
        if (typeof endDate === 'string' && isStrictValidDate(endDate)) updateData.endDate = new Date(endDate);
        if (typeof progress === 'number') {
            const fixedProgress = Math.max(0, Math.min(100, progress));
            updateData.progress = fixedProgress;
            let statutId = 1;
            if (fixedProgress === 0) statutId = 1;
            else if (fixedProgress > 0 && fixedProgress < 100) statutId = 2;
            else if (fixedProgress === 100) statutId = 3;
            updateData.statutId = statutId;
        }
        if (
            updateData.startDate &&
            updateData.endDate &&
            updateData.startDate >= updateData.endDate
        ) {
            return res.apiResponse(400, {message: "La date de début doit être antérieure à la date de fin."});
        }

        try {
            const activity = await prisma.ganttActivity.findUnique({where: {id: activityId}});
            if (!activity) return res.apiResponse(404);

            if (Object.keys(updateData).length > 0) {
                await prisma.ganttActivity.update({
                    where: {id: activityId},
                    data: updateData
                });
            }

            const userProjects = await prisma.userProject.findMany({
                where: { projectId },
                select: { userId: true }
            });
            const usersInProject = userProjects.map(up => up.userId);

            if (userIds) {
                if(!userIds.every(id=>usersInProject.includes(id))) return res.apiResponse(400, "pas de users");
                await prisma.ganttActivityUser.deleteMany({where: {taskId: activityId}});
                if (userIds.length > 0) {
                    await prisma.ganttActivityUser.createMany({
                        data: userIds.map(userId => ({userId, taskId: activityId}))
                    });
                }
            }

            if (dependencesIds) {
                await prisma.ganttActivityAssignement.deleteMany({where: {taskId: activityId}});
                if (dependencesIds.length > 0) {
                    await prisma.ganttActivityAssignement.createMany({
                        data: dependencesIds.map(dependId => ({
                            taskId: activityId,
                            dependTaskId: dependId
                        }))
                    });
                }
            }
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async delete(req: FastifyRequest<{ Params: { activityId: number } }>, res: FastifyReply) {
        const activityId = Number(req.params.activityId);
        if (!activityId) return res.apiResponse(400);

        try {
            const activity = await prisma.ganttActivity.findUnique({where: {id: activityId}});
            if (!activity) return res.apiResponse(404);

            await prisma.ganttActivityUser.deleteMany({where: {taskId: activityId}});

            await prisma.ganttActivityAssignement.deleteMany({where: {taskId: activityId}});
            await prisma.ganttActivityAssignement.deleteMany({where: {dependTaskId: activityId}});

            await prisma.ganttActivity.delete({where: {id: activityId}});

            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

}