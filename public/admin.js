const token = localStorage.getItem('chatToken');
if (!token) {
    alert('Требуется авторизация. Перенаправление на главную.');
    window.location.href = '/';
}

async function checkAdmin() {
    const res = await fetch('/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 403 || res.status === 401) {
        alert('У вас нет прав администратора.');
        window.location.href = '/';
    }
}

async function loadUsers() {
    const res = await fetch('/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await res.json();
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    users.forEach(user => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = user.id;
        row.insertCell(1).innerText = user.username;
        row.insertCell(2).innerText = user.role;
        row.insertCell(3).innerText = new Date(user.created_at).toLocaleString();
        const actions = row.insertCell(4);
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Удалить';
        delBtn.className = 'delete-btn';
        delBtn.onclick = () => deleteUser(user.id);
        actions.appendChild(delBtn);
    });
}

async function loadMessages() {
    const res = await fetch('/admin/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const messages = await res.json();
    const tbody = document.querySelector('#logs-table tbody');
    tbody.innerHTML = '';
    messages.forEach(msg => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = msg.id;
        row.insertCell(1).innerText = msg.username;
        row.insertCell(2).innerText = msg.text;
        row.insertCell(3).innerText = new Date(msg.timestamp).toLocaleString();
        const actions = row.insertCell(4);
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Удалить';
        delBtn.className = 'delete-btn';
        delBtn.onclick = () => deleteMessage(msg.id);
        actions.appendChild(delBtn);
    });
}

async function deleteUser(userId) {
    if (!confirm('Удалить пользователя? Все его сообщения также будут удалены.')) return;
    const res = await fetch(`/admin/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        loadUsers();
    } else {
        const err = await res.json();
        alert('Ошибка: ' + err.message);
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Удалить сообщение?')) return;
    const res = await fetch(`/admin/message/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        loadMessages();
    } else {
        alert('Ошибка удаления');
    }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
        if (tab === 'users') loadUsers();
        if (tab === 'logs') loadMessages();
    });
});

checkAdmin().then(() => {
    loadUsers();
});