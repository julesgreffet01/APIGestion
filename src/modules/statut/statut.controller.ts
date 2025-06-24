import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient()
export default class StatutController {
    async getAll(req: FastifyRequest, res: FastifyReply) {
        try {
            const statuts = await prisma.statut.findMany()
            return res.apiResponse(200, statuts)
        } catch (e) {
            console.error(e)
            return res.apiResponse(500)
        }
    }
}