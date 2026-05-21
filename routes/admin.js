async function adminRoutes(fastify, options) {
  const db = fastify.db;

  const requireAdmin = async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = db.prepare('SELECT role FROM users WHERE id = ?').get(request.user.id);
      if (!user || user.role !== 'admin') {
        return reply.code(403).send({ message: 'Доступ запрещён.' });
      }
    } catch (err) {
      return reply.code(401).send({ message: 'Неавторизован' });
    }
  };

  fastify.get('/admin/users', { preHandler: requireAdmin }, async (request, reply) => {
    const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
    reply.send(users);
  });

  fastify.get('/admin/messages', { preHandler: requireAdmin }, async (request, reply) => {
    const messages = db.prepare(`
      SELECT id, username, text, timestamp 
      FROM messages 
      ORDER BY timestamp DESC 
      LIMIT 500
    `).all();
    reply.send(messages);
  });

  fastify.delete('/admin/message/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;
    const result = db.prepare('DELETE FROM messages WHERE id = ?').run(id);
    if (result.changes === 0) {
      return reply.code(404).send({ message: 'Не найдено' });
    }
    reply.send({ message: 'Удалено' });
  });

  fastify.delete('/admin/user/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;
    if (parseInt(id) === request.user.id) {
      return reply.code(400).send({ message: 'Нельзя удалить себя' });
    }
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) {
      return reply.code(404).send({ message: 'Не найден' });
    }
    reply.send({ message: 'Удалён' });
  });
}

module.exports = adminRoutes;