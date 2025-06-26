import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export default class VaultPasswordController {
    async getAllByUser(req: FastifyRequest, res: FastifyReply){
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(401);
        try {
            const vault = await prisma.vaultPassword.findMany({
                where: {
                    userId
                },
                orderBy: {
                    id: "asc"
                }
            })
            return res.apiResponse(200, vault)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async create(req: FastifyRequest<{Body: {siteName: string, password: string, username: string, iv: string}}>, res: FastifyReply){
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(401);
        const {siteName, password, username, iv} = req.body
        if(!userId) return res.apiResponse(401);
        if(isNaN(userId) || siteName.trim().length || !password || username.trim().length || !iv) return res.apiResponse(403);
        try {
            await prisma.vaultPassword.create({
                data: {
                    siteName,
                    password,
                    username,
                    iv,
                    userId
                }
            })
            return res.apiResponse(201);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async update(req: FastifyRequest<{Body: {siteName?: string, password?: string, username?: string}, Params: {passwordId: number}}>, res: FastifyReply){
        const {siteName, password, username} = req.body
        const passwordId = Number(req.params.passwordId)
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(401);
        if(isNaN(passwordId)) return res.apiResponse(403);
        const dataToUpdate: Record<string, any> = {};
        if (typeof siteName === 'string' && siteName.trim().length > 0) {
            dataToUpdate.siteName = siteName;
        }
        if (typeof password === 'string' && password.trim().length > 0) {
            dataToUpdate.password = password;
        }
        if (typeof username === 'string' && username.trim().length > 0) {
            dataToUpdate.username = username;
        }
        if (Object.keys(dataToUpdate).length === 0) {
            return res.apiResponse(400,'Aucune donnée à mettre à jour' );
        }
        try {
            await prisma.vaultPassword.update({
                where: {
                    id: passwordId,
                    userId
                },
                data: dataToUpdate
            })
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async delete(req: FastifyRequest<{Params: {passwordId: number}}>, res: FastifyReply){
        const passwordId = Number(req.params.passwordId)
        if(isNaN(passwordId)) return res.apiResponse(400);
        const userId = req.user?.userId;
        if(!userId) return res.apiResponse(400);
        try {
            await prisma.vaultPassword.delete({
                where: {
                    id: passwordId,
                    userId
                }
            })
            return res.apiResponse(200)
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }
}