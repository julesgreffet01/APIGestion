import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyReply} from "fastify";

const prisma = new PrismaClient();

export function useCheckActivityInGantt(){
    return async function(req: FastifyRequest<{ Params: { ganttId: number; activityId: number } }>, res: FastifyReply){
        const activityId = Number(req.params.activityId);
        const ganttId = Number(req.params.ganttId);
        if (!ganttId || !activityId) {
            return res.apiResponse(500);
        }
        try {
            const activity = await prisma.ganttActivity.findUnique({
                where: {
                    id: activityId,
                    ganttId
                }
            })
            if (!activity) return res.apiResponse(500);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}

