import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyReply} from "fastify";

const prisma = new PrismaClient();

export function useCheckTaskInTodo(){
    return async function(req: FastifyRequest<{ Params: { toDoId: number; taskId: number } }>, res: FastifyReply){
        const todoId = Number(req.params.toDoId);
        const taskId = Number(req.params.taskId);
        if (!todoId || !taskId) {
            return res.apiResponse(500);
        }
        try {
            const task = await prisma.toDoTask.findUnique({
                where: {
                    id: taskId,
                    todoId
                }
            })
            if(!task) return res.apiResponse(500);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}