import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import ProjectController from "./project.controller";
import {useVerifyToken, useRequireRole} from '../../hooks/droits'

const projectRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const projectController = new ProjectController();
    fastify.addHook('preHandler', useVerifyToken());

    fastify.get('/', projectController.getAll)
    fastify.get('/del', projectController.getAllDel)
    fastify.get('/recent', projectController.getAllRecents)
    fastify.post<{Body: {name: string, description: string}}>('/', projectController.create)
    fastify.post<{Body: {peopleId: number, roleId: number}, Params: {projectId: number}}>('/addPeople/:projectId',{preHandler: useRequireRole(['Admin'])},projectController.addPeople)
    fastify.put<{Body: {name?: string, description?: string}, Params: {projectId: number}}>('/:projectId',{preHandler: useRequireRole(['Admin'])} , projectController.update)
    fastify.put<{Body: {peopleId: number, roleId: number}, Params: {projectId: number}}>('/updatePeople/:projectId', {preHandler: useRequireRole(['Admin'])}, projectController.updatePeople)
    fastify.put<{Body: {projectId: number}}>('/leave', projectController.leave)
    fastify.put<{Params: {projectId: number}}>('/restore/:projectId', projectController.restore)
    fastify.delete<{Params: {projectId: number}}>('/:projectId', projectController.delete)


}

export default projectRoutes;