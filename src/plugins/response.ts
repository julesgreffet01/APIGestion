import fp from 'fastify-plugin'
import {FastifyInstance, FastifyReply} from 'fastify'

export default fp(async function (fastify: FastifyInstance) {
    fastify.decorateReply('apiResponse', function (statusCode: number, data = null): FastifyReply {
        const defaultMessages: Record<number, string> = {
            200: 'Succès',
            201: 'Créé avec succès',
            400: 'Requête invalide',
            401: 'Non autorisé',
            403: 'Accès interdit',
            404: 'Ressource introuvable',
            405: 'probleme de token',
            500: 'Erreur interne du serveur',
        }

        const response = {
            message: defaultMessages[statusCode] || 'requete valide',
            data: ''
        }
        if (data !== null) {
            response.data = data
        }
        return this.code(statusCode).send(response)
    });
});