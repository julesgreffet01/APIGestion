import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyReply} from "fastify";

const prisma = new PrismaClient();

export function useCheckTodoInProject(){
    return async function (req: FastifyRequest<{ Params: { projectId: number; toDoId: number } }>, res: FastifyReply){
        const projectId = Number(req.params.projectId);
        const todoId = Number(req.params.toDoId);
        if (!todoId || !projectId) {
            return res.apiResponse(500);
        }
        try {
            const todo = prisma.toDo.findUnique({
                where: {
                    id: todoId,
                    projectId
                }
            })
            if(!todo) return res.apiResponse(500);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}