const fastify = require('fastify')({ logger: false });
const path = require('path');
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

fastify.register(require('@fastify/jwt'), { secret: 'ключ' });
fastify.register(require('@fastify/websocket'));
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// не переписывай
async function start() {
  const db = await initializeDatabase();
  fastify.decorate('db', db);
  fastify.register(authRoutes);
  fastify.register(chatRoutes);

  try {
    await fastify.listen({ port: 3000 });
    console.log('Сервер запущен на http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();