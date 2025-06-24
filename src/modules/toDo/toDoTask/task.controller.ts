import {FastifyRequest, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';
import {isStrictValidDate} from '../../../utils/date'

const prisma = new PrismaClient();
export default class taskController {
    async getAllByTodoByPosition(req: FastifyRequest<{ Params: { toDoId: number } }>, res: FastifyReply) {
        const todoId = Number(req.params.toDoId);
        if (!todoId) return res.apiResponse(401);
        try {
            const tasks = await prisma.toDoTask.findMany({
                where: {
                    todoId,
                    realised: false
                },
                orderBy: { position: 'desc' }
            });

            return res.apiResponse(200, tasks);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async getAllRealisedByTodo(req: FastifyRequest<{ Params: { toDoId: number } }>, res: FastifyReply) {
        const todoId = Number(req.params.toDoId);
        if (!todoId) return res.apiResponse(401);
        try {
            const tasks = await prisma.toDoTask.findMany({
                where: {
                    todoId,
                    realised: true
                }
            });
            return res.apiResponse(200, tasks);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async create(req: FastifyRequest<{ Params: { toDoId: number }, Body: { name: string, userIds?: number[], realDate?: string } }>, res: FastifyReply) {
        const todoId = Number(req.params.toDoId);
        const { name, userIds, realDate } = req.body;
        if (!todoId || !name || name.trim().length === 0) return res.apiResponse(401);
        try {
            const todo = await prisma.toDo.findUnique({
                where: { id: todoId },
                select: { projectId: true }
            });
            if (!todo) return res.apiResponse(404, { message: "ToDo not found" });

            if (userIds && userIds.length > 0) {
                const validUserProjects = await prisma.userProject.findMany({
                    where: {
                        userId: { in: userIds },
                        projectId: todo.projectId
                    },
                    select: { userId: true }
                });
                const validUserIds = validUserProjects.map(up => up.userId);
                if (validUserIds.length !== userIds.length) return res.apiResponse(400, { message: "Certains utilisateurs ne sont pas membres du projet !" });
            }
            const lastTask = await prisma.toDoTask.findFirst({
                where: { todoId },
                orderBy: { position: "desc" },
                select: { position: true }
            });
            const nextPosition = lastTask ? lastTask.position + 1 : 1;

            const data: any = {
                name,
                position: nextPosition,
                todoId
            };
            if (realDate && isStrictValidDate(realDate)) {
                data.realDate = new Date(realDate);
            }
            const newTask = await prisma.toDoTask.create({ data });

            if (userIds && userIds.length > 0) {
                await prisma.toDoTaskUser.createMany({
                    data: userIds.map(userId => ({
                        userId,
                        taskId: newTask.id
                    })),
                    skipDuplicates: true
                });
            }
            return res.apiResponse(201);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async update(req: FastifyRequest<{ Params: { taskId: number }, Body: { name?: string, realDate?: string }}>, res: FastifyReply) {
        const taskId = Number(req.params.taskId);
        const { name, realDate } = req.body;
        if (!taskId) {
            return res.apiResponse(401);
        }
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (realDate !== undefined && isStrictValidDate(realDate)) data.realDate = new Date(realDate);
        if (Object.keys(data).length === 0) {
            return res.apiResponse(400, { message: "Aucune donnée à mettre à jour." });
        }
        try {
            const updatedTask = await prisma.toDoTask.update({
                where: { id: taskId },
                data
            });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async realised(req: FastifyRequest<{ Params: { taskId: number } }>, res: FastifyReply) {
        const taskId = Number(req.params.taskId);
        const userId = req.user?.userId;
        if (!taskId || !userId) return res.apiResponse(401);
        try {
            const updatedTask = await prisma.toDoTask.update({
                where: { id: taskId },
                data: {
                    realised: true,
                    statutId: 3,
                    realisatorId: userId,
                }
            });
            return res.apiResponse(200, updatedTask);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async reorder(req: FastifyRequest<{ Params: { toDoId: number }, Body: { orderedTaskIds: number[] } }>, res: FastifyReply) {
        const todoId  = Number(req.params.toDoId);
        const { orderedTaskIds } = req.body;
        if (!todoId || !Array.isArray(orderedTaskIds)) {
            return res.apiResponse(400);
        }
        try {
            const validTasks = await prisma.toDoTask.findMany({
                where: {
                    id: { in: orderedTaskIds },
                    todoId: Number(todoId)
                },
                select: { id: true }
            });
            const validTaskIds = validTasks.map(t => t.id);
            if (validTaskIds.length !== orderedTaskIds.length) {
                return res.apiResponse(403);
            }
            for (let index = 0; index < orderedTaskIds.length; index++) {
                const taskId = orderedTaskIds[index];
                await prisma.toDoTask.update({
                    where: { id: taskId },
                    data: { position: index + 1 }
                });
            }
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async delete(req: FastifyRequest<{ Params: { taskId: number } }>, res: FastifyReply) {
        const taskId = Number(req.params.taskId);
        if (!taskId) return res.apiResponse(401);
        try {
            await prisma.toDoTaskUser.deleteMany({
                where: { taskId }
            });

            await prisma.toDoTask.delete({
                where: { id: taskId }
            });

            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}