import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient()

export default class RoleController {
    async getAll(request: FastifyRequest, res: FastifyReply) {
        try {
            const roles = await prisma.role.findMany()
            return res.apiResponse(200, roles)
        } catch (e) {
            console.error(e)
            res.apiResponse(500)
        }
    }
}