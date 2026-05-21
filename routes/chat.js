const { verifySocketToken } = require('../utils/auth');

async function chatRoutes(fastify, options) {
  const db = fastify.db;

  fastify.get('/chat', { websocket: true }, (connection, req) => {
    const token = req.query.token;
    const decoded = verifySocketToken(fastify, token);
    if (!decoded) {
      const ws = connection.socket || connection;
      if (ws && ws.close) ws.close(1008, 'Недействительный токен');
      return;
    }

    const userId = decoded.id;
    const username = decoded.username;
    const ws = connection.socket || connection;

    if (!fastify.connectedClients) fastify.connectedClients = [];
    const clientInfo = { id: userId, username, socket: ws };
    fastify.connectedClients.push(clientInfo);

    ws.on('message', (rawMessage) => {
      let messageText;
      try {
        const parsed = JSON.parse(rawMessage);
        messageText = parsed.text;
      } catch (e) {
        return;
      }
      if (!messageText) return;

      const stmt = db.prepare('INSERT INTO messages (user_id, username, text) VALUES (?, ?, ?)');
      stmt.run(userId, username, messageText);

      const outgoing = JSON.stringify({
        username: username,
        text: messageText,
        timestamp: new Date().toISOString()
      });

      fastify.connectedClients.forEach(client => {
        if (client.socket.readyState === 1) {
          client.socket.send(outgoing);
        }
      });
    });

    ws.on('close', () => {
      const index = fastify.connectedClients.findIndex(c => c.id === userId);
      if (index !== -1) fastify.connectedClients.splice(index, 1);
    });
  });
}

module.exports = chatRoutes;