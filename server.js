const fastify = require('fastify')({ logger: true });
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

fastify.register(require('@fastify/jwt'), { secret: 'supersecretkey' });
fastify.register(require('@fastify/websocket'));
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

fastify.decorate('db', db);
fastify.register(authRoutes);
fastify.register(chatRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Сервер запущен на http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();