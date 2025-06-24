import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient()
export default class TodoController {
    async getAllByProject(req: FastifyRequest<{Params: {projectId: number}}>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        if (!projectId) return res.apiResponse(401);
        try {
            const project = await prisma.project.findFirst({ where: { id: projectId } });
            if (!project) return res.apiResponse(401);
            const todos = await prisma.toDo.findMany({
                where: { projectId },
                include: {
                    tasks: {
                        select: {
                            statutId: true  // ou isCompleted: true si c'est ton champ de complétion
                        }
                    }
                }
            });
            const todosWithCounts = todos.map(todo => {
                const statusCounts = { Completed: 0 };
                let total = 0;

                todo.tasks.forEach(task => {
                    if (task.statutId === 3) statusCounts.Completed++; // adapte selon ta logique
                    total++;
                });
                return {
                    id: todo.id,
                    name: todo.name,
                    projectId: todo.projectId,
                    TaskCompleted: statusCounts.Completed,
                    TaskGlobal: total
                };
            });
            return res.apiResponse(200, todosWithCounts);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async create(req: FastifyRequest<{ Params: { projectId: number }, Body: { name: string } }>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        const name = req.body.name;
        if (!projectId || !name || name.trim().length < 1) return res.apiResponse(401);
        try {
            await prisma.toDo.create({
                data: { name, projectId },
            });
            return res.apiResponse(201);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async update(req: FastifyRequest<{ Body: { name: string }, Params: { toDoId: number } }>, res: FastifyReply) {
        const name = req.body.name;
        const toDoId = Number(req.params.toDoId);
        if (!toDoId || !name || name.trim().length < 1) return res.apiResponse(401);

        try {
            const todo = await prisma.toDo.findUniqueOrThrow({ where: { id: toDoId } });
            await prisma.toDo.update({ where: { id: toDoId }, data: { name } });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async delete(req: FastifyRequest<{ Params: { toDoId: number } }>, res: FastifyReply) {
        const toDoId = Number(req.params.toDoId);
        if (!toDoId) return res.apiResponse(401);
        try {
            await prisma.toDo.delete({ where: { id: toDoId } });
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}