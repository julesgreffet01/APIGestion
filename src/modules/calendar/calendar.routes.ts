import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import CalendarController from "./calendar.controller";
import {useVerifyToken} from '../../hooks/droits'

const calendarRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const calendarController = new CalendarController();
    fastify.addHook('preHandler', useVerifyToken());

    fastify.get<{Params : {month: number, year: number}}>('/accueil/:month/:year', calendarController.getAllThisMonth);
    fastify.get<{Params: {day: string}}>('/week/:day', calendarController.getAllByWeek);
    fastify.post<{Body: {name: string, description: string, dateEvent: string}}>('/', calendarController.create)
    fastify.put<{Body: {name?: string, description?: string, dateEvent?: string}, Params: {eventId: number}}>('/:eventId', calendarController.update)
    fastify.delete<{Params: {eventId: number}}>('/:eventId', calendarController.delete)
}

export default calendarRoutes;