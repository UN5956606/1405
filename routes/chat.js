const { verifySocketToken } = require('../utils/auth');

async function chatRoutes(fastify, options) {
  fastify.get('/chat', { websocket: true }, (connection, req) => {
    console.log('WebSocket запрос, query:', req.query);
    const token = req.query.token;
    if (!token) {
      console.log('Токен отсутствует');
      const ws = connection.socket || connection;
      if (ws && ws.close) ws.close(1008, 'Токен не предоставлен');
      return;
    }

    const decoded = verifySocketToken(fastify, token);
    if (!decoded) {
      console.log('Невалидный токен');
      const ws = connection.socket || connection;
      if (ws && ws.close) ws.close(1008, 'Недействительный токен');
      return;
    }

    console.log(`Пользователь ${decoded.username} подключился`);
    const userId = decoded.id;
    const username = decoded.username;

    const ws = connection.socket || connection;
    if (!ws || typeof ws.on !== 'function') {
      console.error('Не удалось получить WebSocket объект', connection);
      if (ws && ws.close) ws.close(1011, 'Ошибка сервера');
      return;
    }

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

      const outgoing = JSON.stringify({
        username: username,
        text: messageText,
        timestamp: new Date().toISOString()
      });

      fastify.connectedClients.forEach(client => {
        if (client.socket.readyState === 1) { // OPEN
          client.socket.send(outgoing);
        }
      });
    });

    ws.on('close', () => {
      console.log(`Пользователь ${username} отключился`);
      const index = fastify.connectedClients.findIndex(c => c.id === userId);
      if (index !== -1) fastify.connectedClients.splice(index, 1);
    });
  });
}

module.exports = chatRoutes;