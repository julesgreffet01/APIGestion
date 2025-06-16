// controllers/AuthController.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { MultipartFile } from 'fastify-multipart'
import { pipeline } from 'stream'
import { promisify } from 'util'

const pump = promisify(pipeline)
const prisma = new PrismaClient()

export default class AuthController {
    async login(
        req: FastifyRequest<{ Body: { email: string; password: string } }>,
        reply: FastifyReply
    ) {
        const { email, password } = req.body
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.apiResponse(401,'Email ou mot de passe incorrect')
        }

        const token = reply.jwtSign({ userId: user.id })
        return reply.apiResponse(200, { token })
    }

    async register(req: FastifyRequest, reply: FastifyReply) {
        const userData: Record<string, string> = {}
        let photoFileName: string | null = null

        // Parcours des parties multipart
        for await (const part of req.parts() as AsyncIterableIterator<MultipartFile>) {
            if (part.file && part.filename) {
                // vérif extension
                const ext = path.extname(part.filename).toLowerCase()
                if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
                    return reply.apiResponse(400, 'Format de fichier non supporté (jpg, png)')
                }

                const safeName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`
                const filePath = path.join(__dirname, '..', 'uploads', safeName)
                await pump(part.file, fs.createWriteStream(filePath))
                photoFileName = safeName
            } else {
                const field = part as unknown as { fieldname: string; value: string }
                userData[field.fieldname] = field.value
            }
        }

        const { email, password, name, firstName } = userData
        if (!email || !password || !name || !firstName) {
            return reply.apiResponse(400,'Tous les champs sont requis')
        }
        if (await prisma.user.findUnique({ where: { email } })) {
            return reply.apiResponse(400, 'Email déjà utilisé')
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const salt = await bcrypt.genSalt(10)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                firstName,
                photo: photoFileName ? `/uploads/${photoFileName}` : null,
                salt: salt
            },
        })

        if(!user) return reply.apiResponse(404)

        return reply.apiResponse(201, 'Compte créé avec succès')
    }
}
