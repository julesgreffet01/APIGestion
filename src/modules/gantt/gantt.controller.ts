import {FastifyRequest, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();
export default class GanttController {
    async getAllByProject(req: FastifyRequest<{ Params: { projectId: number } }>, res: FastifyReply) {
        const projectId = Number(req.params.projectId);
        if (!projectId) return res.apiResponse(401);
        try {
            const project = await prisma.project.findFirst({ where: { id: projectId } });
            if (!project) return res.apiResponse(401);
            const gantts = await prisma.gantt.findMany({
                where: { projectId },
                include: {
                    activities: {
                        select: {
                            statutId: true
                        }
                    }
                }
            });
            const ganttsWithCounts = gantts.map(gantt => {
                const statusCounts = {Completed: 0 };
                let total = 0;

                gantt.activities.forEach(activity => {
                    if (activity.statutId === 3) statusCounts.Completed++;
                    total ++;
                });
                return {
                    id: gantt.id,
                    name: gantt.name,
                    projectId: gantt.projectId,
                    ActivityCompleted: statusCounts.Completed,
                    ActivityGlobal: total
                };
            });
            return res.apiResponse(200, ganttsWithCounts);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }


    async create(req: FastifyRequest<{Params: {projectId: number}, Body: {name: string}}>, res: FastifyReply){
        const projectId = Number(req.params.projectId);
        const name = req.body.name;
        if(!projectId || !name || name.trim().length < 1) return res.apiResponse(401)
        try {
            await prisma.gantt.create({
                data: {name, projectId},
            })
            return res.apiResponse(201)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500)
        }
    }

    async update(req: FastifyRequest<{Body: {name: string}, Params: {ganttId: number}}>, res: FastifyReply) {
        const name = req.body.name;
        const ganttId = Number(req.params.ganttId);
        if(!ganttId || !name || name.trim().length < 1) return res.apiResponse(401)
        try {
            const gantt = await prisma.gantt.findUniqueOrThrow({where: {id: ganttId}});
            await prisma.gantt.update({where: {id: ganttId}, data: {name}});
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500)
        }
    }

    async delete(req: FastifyRequest<{Params: {ganttId: number}}>, res: FastifyReply) {
        const ganttId = Number(req.params.ganttId);
        if(!ganttId) return res.apiResponse(401)
        try {
            await prisma.gantt.delete({where: {id: ganttId}});
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500)
        }
    }

}