import {FastifyRequest, FastifyReply} from 'fastify';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();
export default class GanttController {
    async getAllByProject(req: FastifyRequest, res: FastifyReply){

    }
}