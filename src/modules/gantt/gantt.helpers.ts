import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyReply} from "fastify";

const prisma = new PrismaClient();

export function useCheckGanttInProject() {
    return async function (req: FastifyRequest<{ Params: { projectId: number; ganttId: number } }>, res: FastifyReply){
        const projectId = Number(req.params.projectId);
        const ganttId = Number(req.params.ganttId);
        if (!ganttId || !projectId) {
            return res.apiResponse(500);
        }
        try {
            const gantt = await prisma.gantt.findUnique({
                where: {
                    id: ganttId,
                    projectId
                }
            });
            if (!gantt) {
                return res.apiResponse(500);
            }
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    };
}