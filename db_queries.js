const db = require('./database');

console.log('=== УП.11 – Запросы к chat.db ===\n');

console.log('1. Сообщения пользователя с id = 5:');
const userMessages = db.prepare('SELECT * FROM messages WHERE user_id = 5').all();
console.table(userMessages);

console.log('\n2. Добавление сообщения от puber:');
const insert = db.prepare('INSERT INTO messages (user_id, username, text) VALUES (?, ?, ?)');
const insertResult = insert.run(1, 'puber', 'брооо... это задание');
console.log(`Вставлено, id = ${insertResult.lastInsertRowid}`);

console.log('\n3. Обновление текста сообщения с id = 12:');
const update = db.prepare('UPDATE messages SET text = ? WHERE id = ?');
const updateResult = update.run('крутой текст.', 12);
console.log(`Обновлено строк: ${updateResult.changes}`);

console.log('\n4. Удаление сообщения с id = 8:');
const del = db.prepare('DELETE FROM messages WHERE id = ?');
const delResult = del.run(8);
console.log(`Удалено строк: ${delResult.changes}`);

console.log('\n5. Все сообщения с именами пользователей (JOIN):');
const joinQuery = db.prepare(`
    SELECT messages.id, users.username, messages.text, messages.timestamp
    FROM messages
    JOIN users ON messages.user_id = users.id
    ORDER BY messages.timestamp DESC
`);
const joined = joinQuery.all();
console.table(joined);

console.log('\nГотово.');