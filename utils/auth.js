function verifySocketToken(fastify, token) {
  try {
    return fastify.jwt.verify(token);
  } catch (err) {
    fastify.log.warn({ err }, 'Ошибка верификации WebSocket токена');
    return null;
  }
}

module.exports = { verifySocketToken };