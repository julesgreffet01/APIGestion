import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import ProjectController from "./project.controller.js";
import {useVerifyToken, useRequireRole, useCheckAccessProject} from '../../hooks/droits.js'
import ganttRoutes from "../gantt/gantt.routes.js";
import todoRoutes from "../toDo/todo.routes.js";
import trelloRoutes from "../trello/trello.routes.js";

const projectRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const projectController = new ProjectController();
    fastify.addHook('preHandler', useVerifyToken());

    fastify.get('/', projectController.getAll)
    fastify.get('/del', projectController.getAllDel)
    fastify.get('/recent', projectController.getAllRecents)
    fastify.post<{Body: {name: string, description: string}}>('/', projectController.create)
    fastify.post<{Body: {peopleId: number, roleId: number}, Params: {projectId: number}}>('/addPeople/:projectId',{preHandler: [useCheckAccessProject(), useRequireRole(['Admin'])]},projectController.addPeople)
    fastify.put<{Body: {name?: string, description?: string}, Params: {projectId: number}}>('/:projectId',{preHandler: [useCheckAccessProject(), useRequireRole(['Admin'])]} , projectController.update)
    fastify.put<{Body: {peopleId: number, roleId: number}, Params: {projectId: number}}>('/updatePeople/:projectId', {preHandler:  [useCheckAccessProject(), useRequireRole(['Admin'])]}, projectController.updatePeople)
    fastify.put<{Params: {projectId: number}}>('/leave/:projectId',{preHandler: useCheckAccessProject()}, projectController.leave)
    fastify.put<{Params: {projectId: number}}>('/restore/:projectId', {preHandler: useCheckAccessProject()}, projectController.restore)
    fastify.delete<{Params: {projectId: number}}>('/:projectId',{preHandler: useCheckAccessProject()}, projectController.delete)

    fastify.register(async function (projectScoped) {
        projectScoped.addHook('preHandler', useCheckAccessProject())
        await projectScoped.register(ganttRoutes, { prefix: '/:projectId/gantt' });
        await projectScoped.register(todoRoutes, {prefix: '/:projectId/todo'});
        await projectScoped.register(trelloRoutes, {prefix: '/:projectId/trello'});
    });
}

export default projectRoutes;