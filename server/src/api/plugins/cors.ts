import fastifyCors from '@fastify/cors';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export default fp(async function(fastify: FastifyInstance) {
  fastify.register(fastifyCors, { 
    // CORS configuration
    origin: true, // Allow all origins (in development)
    // For production, you might want to restrict this:
    // origin: ['https://your-frontend-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  });
});