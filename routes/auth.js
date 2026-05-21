const bcrypt = require('bcrypt');

async function authRoutes(fastify, options) {
  const db = fastify.db;

  fastify.post('/register', async (req, reply) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return reply.code(400).send({ message: 'Имя и пароль обязательны' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return reply.code(409).send({ message: 'Имя уже занято' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hashedPassword);
      reply.code(201).send({ message: 'Регистрация успешна' });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ message: 'Ошибка сервера' });
    }
  });

  fastify.post('/login', async (req, reply) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?').get(username);
    if (!user) {
      return reply.code(401).send({ message: 'Неверные данные' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return reply.code(401).send({ message: 'Неверные данные' });
    }
    
    const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role }, { expiresIn: '24h' });
    reply.send({ token, username: user.username, role: user.role });
  });
}

module.exports = authRoutes;