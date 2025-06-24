import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import TodoController from "./todo.controller";
import {useRequireRole} from '../../hooks/droits'
import {useCheckTodoInProject} from "./todo.helpers";

const todoRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const todoController = new TodoController()

    fastify.get('/', todoController.getAllByProject);
    fastify.post<{ Params: { projectId: number }, Body: { name: string } }>('/', {preHandler: useRequireRole(["Admin"])}, todoController.create)
    fastify.put<{ Body: { name: string }, Params: { toDoId: number, projectId: number } }>('/:toDoId', {preHandler: [useRequireRole(["Admin"]), useCheckTodoInProject()]}, todoController.update)
    fastify.delete<{ Params: { toDoId: number, projectId: number } }>('/:toDoId', {preHandler: [useRequireRole(["Admin"]), useCheckTodoInProject()]}, todoController.delete)
}
export default todoRoutes;