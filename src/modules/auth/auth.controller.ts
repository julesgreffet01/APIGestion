import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import {sendMail} from '../../utils/mailer';
import {normalizeEmail} from "../../utils/email";

const pump = promisify(pipeline)
const prisma = new PrismaClient()

export default class AuthController {

    async login(req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) {
        const ip = req.ip;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        //---------- verification du nombres de tentatives -------------
        const failedAttempts = await prisma.loginLog.count({
            where: {
                ipAddress: ip,
                success: false,
                attemptedAt: { gte: oneHourAgo },
            },
        });

        if (failedAttempts >= 5) {
            const existingBan = await prisma.ipBan.findUnique({
                where: { ipAddress: ip },
            });
            if (!existingBan) {
                await prisma.ipBan.create({ data: { ipAddress: ip } });
            }
        }

        //--------- verification des ip ban -----------
        const ipBan = await prisma.ipBan.findUnique({
            where: { ipAddress: ip },
        });

        if (ipBan) {
            await prisma.loginLog.create({
                data: { success: false, ipAddress: ip },
            });
            return reply.apiResponse(401, 'Trop de tentatives.');
        }

        //------- verification du user --------
        let { email, password } = req.body;
        if (!email || !password) {
            return reply.apiResponse(400, 'Email et mot de passe sont requis.');
        }
        email = normalizeEmail(email);
        const user = await prisma.user.findUnique({ where: { email } });
        const isMatch = !!user && (await bcrypt.compare(password, user.password));

        await prisma.loginLog.create({
            data: { success: isMatch, ipAddress: ip },
        });

        if (!isMatch) {
            return reply.apiResponse(401, 'Email ou mot de passe incorrect');
        }

        //--------- token ------------
        const token = await reply.jwtSign({ userId: user!.id }, { expiresIn: '5h' });

        //---------- OK -------------
        return reply.apiResponse(200, { token });
    }

    async register(req: FastifyRequest, reply: FastifyReply) {
        type UserData = {
            email?: string
            password?: string
            name?: string
            firstName?: string
            passwordKey?: string
            keySalt?: string  // 🔑 PBKDF2 salt pour le chiffrement
            iv?: string       // 🔑 IV AES-GCM
        }

        const userData: UserData = {}
        let photoFileName: string | null = null
        const ALLOWED_EXTS = [".jpg", ".jpeg", ".png"]

        // 2. Parcours des parties
        for await (const part of req.parts()) {
            if (part.type === "file") {
                const filename = part.filename ?? ""
                const ext = path.extname(filename).toLowerCase()
                if (!ALLOWED_EXTS.includes(ext)) {
                    return reply.apiResponse(400, "Format de fichier non supporté (jpg, png)")
                }
                photoFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
                const uploadsPath = path.join(process.cwd(), 'uploads')
                const filePath = path.join(uploadsPath, photoFileName)
                await pump(part.file, fs.createWriteStream(filePath))
            } else if (part.type === "field") {
                if (
                    ["email", "password", "name", "firstName", "passwordKey", "keySalt", "iv"].includes(
                        part.fieldname
                    )
                ) {
                    userData[part.fieldname as keyof UserData] = part.value as string
                }
            }
        }

        // 3. Validation des champs requis
        let { email, password, name, firstName, passwordKey, keySalt, iv } = userData

        if (![email, password, name, firstName, passwordKey, keySalt, iv].every(Boolean)) {
            return reply.apiResponse(400, "Tous les champs sont requis (clé, salt, iv inclus)")
        }

        const safePasswordKey = passwordKey!
        const safeKeySalt = keySalt!
        const safeIv = iv!

        // 4. Vérifier unicité email
        email = normalizeEmail(email as string)
        if (await prisma.user.findUnique({ where: { email } })) {
            return reply.apiResponse(400, "Email déjà utilisé")
        }

        // 5. Génération du sel BCRYPT et hash
        const bcryptSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password!, bcryptSalt)

        // 6. Création de l’utilisateur avec keySalt et iv stockés
        const newUser = await prisma.user.create({
            data: {
                email: email!,
                password: hashedPassword,
                name: name!,
                firstName: firstName!,
                photo: photoFileName ? `/uploads/${photoFileName}` : null,
                passwordKey: safePasswordKey, // clé random chiffrée
                keySalt: safeKeySalt,         // salt PBKDF2
                iv: safeIv,                   // iv AES-GCM
                salt: bcryptSalt,         // sel bcrypt
            },
        })

        // 7. Retour
        if (!newUser) {
            return reply.apiResponse(404)
        }
        return reply.apiResponse(201)
    }



    async recuperationMDP(req: FastifyRequest<{ Body: { email: string }}>, reply: FastifyReply) {
        let { email } = req.body;
        if(!email) return reply.apiResponse(401);
        email = normalizeEmail(email as string);
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (!user) {
            return reply.apiResponse(404);
        }
        const token = await reply.jwtSign(
            { userId: user.id },
            { expiresIn: '15m' }
        );
        await sendMail(email, token);
        return reply.apiResponse(200, 'Email envoyé');
    }

    async reinitialisationMDP(req: FastifyRequest<{ Body: { newPassword: string }}>, reply: FastifyReply) {
        const newPassword = req.body.newPassword
        await req.jwtVerify();
        const userId = req.user?.userId;
        const realPassword = await bcrypt.hash(newPassword, 10)
        const newUser = await prisma.user.update({
            where: {id: userId},
            data: {
                password: realPassword,
            }
        })
        if(!newUser) return reply.apiResponse(404)
        return reply.apiResponse(200, 'changement effectue')
    }

}
