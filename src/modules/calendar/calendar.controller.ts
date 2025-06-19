import {FastifyRequest, FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isValid, parseISO } from 'date-fns';

const prisma = new PrismaClient();
export default class CalendarController {
    async getAllThisMonth(req: FastifyRequest<{Params: {month: number, year: number}}>, res: FastifyReply) {
        const userId = req.user?.userId;
        if (!req.user) return res.apiResponse(400)
        const year = Number(req.params.year);
        const month = Number(req.params.month);
        const referenceDate = new Date(year, month - 1, 1);
        const start = startOfMonth(referenceDate);
        const end = endOfMonth(referenceDate);
        const events = await prisma.calendarEvent.findMany({
            where: {
                userId,
                dateEvent: {
                    gte: start,
                    lte: end,
                },
            }
        });
        return res.apiResponse(200, events);
    }

    async getAllByWeek(req: FastifyRequest<{Params: {day: string}}>, res: FastifyReply) {
        const { day } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.apiResponse(401, 'Non autorisé');
        }
        if (!day) {
            return res.apiResponse(400, 'Paramètre "day" requis');
        }
        const date = parseISO(day);
        if (!isValid(date)) {
            return res.apiResponse(400, 'Date invalide');
        }
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = endOfWeek(date, { weekStartsOn: 1 });
        try {
            const events = await prisma.calendarEvent.findMany({
                where: {
                    userId,
                    dateEvent: {
                        gte: start,
                        lte: end,
                    },
                },
                orderBy: {
                    dateEvent: 'asc',
                },
            });

            return res.apiResponse(200,events);
        } catch (err) {
            console.error(err);
            return res.apiResponse(500);
        }
    }

    async create(req: FastifyRequest<{Body: {name: string, description: string, dateEvent: string}}>, res: FastifyReply) {
        const userId = req.user?.userId;
        if (!userId) return res.apiResponse(400)
        const {name, description, dateEvent} = req.body;
        if(![name, dateEvent].every(Boolean)) return res.apiResponse(400, 'éléments manquants');
        const parsedDate = new Date(dateEvent);
        if (isNaN(parsedDate.getTime())) return res.apiResponse(400);
        try {
            await prisma.calendarEvent.create({
                data: {
                    name,
                    description,
                    dateEvent: parsedDate,
                    userId,
                }
            })
            return res.apiResponse(201)
        } catch (err) {
            console.error(err);
            return res.apiResponse(500);
        }
    }

    async update(req: FastifyRequest<{Body: {name?: string, description?: string, dateEvent?: string}, Params: {eventId: number}}>, res: FastifyReply){
        const {name, description, dateEvent} = req.body;
        const eventId = Number(req.params.eventId);
        try {
            const event = await prisma.calendarEvent.findUnique({
                where: {
                    id: eventId,
                }
            })
            if(!event) return res.apiResponse(400)
        } catch (err) {
            console.error(err)
            return res.apiResponse(500);
        }
        const dataToUpdate: Record<string, any> = {};
        if(name !== undefined) dataToUpdate.name = name;
        if(description !== undefined) dataToUpdate.description = description;
        if(dateEvent !== undefined) dataToUpdate.dateEvent = dateEvent;
        if (Object.keys(dataToUpdate).length === 0) {
            return res.apiResponse(401,'Aucune donnée à mettre à jour' );
        }
        try {
            await prisma.calendarEvent.update({
                where: {
                    id: eventId,
                },
                data: dataToUpdate,
            })
            return res.apiResponse(200);
        } catch (e) {
            console.error(e);
            return res.apiResponse(500);
        }
    }

    async delete(req: FastifyRequest<{Params: {eventId: number}}>, res: FastifyReply){
        try {
            await prisma.calendarEvent.delete({
                where: {
                    id: Number(req.params.eventId),
                }
            })
            return res.apiResponse(200);
        } catch (err) {
            console.error(err);
            return res.apiResponse(500);
        }
    }
}