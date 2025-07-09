import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import TodoController from "./todo.controller.js";
import {useRequireRole} from '../../hooks/droits.js'
import {useCheckTodoInProject} from "./todo.helpers.js";
import taskRoutes from "./toDoTask/task.routes.js";

const todoRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const todoController = new TodoController()

    fastify.get('/', todoController.getAllByProject);
    fastify.post<{ Params: { projectId: number }, Body: { name: string } }>('/', {preHandler: useRequireRole(["Admin"])}, todoController.create)
    fastify.put<{ Body: { name: string }, Params: { toDoId: number, projectId: number } }>('/:toDoId', {preHandler: [useRequireRole(["Admin"]), useCheckTodoInProject()]}, todoController.update)
    fastify.delete<{ Params: { toDoId: number, projectId: number } }>('/:toDoId', {preHandler: [useRequireRole(["Admin"]), useCheckTodoInProject()]}, todoController.delete)

    fastify.register(async function (projectScoped) {
        await projectScoped.register(taskRoutes, { prefix: '/:toDoId/task' });
    });
}
export default todoRoutes;