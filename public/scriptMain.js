let ws = null;
let jwtToken = null;

function showLogin() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    try {
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            alert('Регистрация успешна! Теперь войдите.');
            showLogin();
        } else {
            const err = await res.json();
            document.getElementById('reg-error').innerText = err.message || 'Ошибка регистрации';
        }
    } catch(e) { console.error(e); }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            const data = await res.json();
            jwtToken = data.token;
            localStorage.setItem('chatToken', jwtToken);
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('chat-app').classList.remove('hidden');
            connectWebSocket();
        } else {
            const err = await res.json();
            document.getElementById('login-error').innerText = err.message || 'Ошибка входа';
        }
    } catch(e) { console.error(e); }
}

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    ws = new WebSocket(`ws://localhost:3000/chat?token=${jwtToken}`);
    ws.onopen = () => console.log('WebSocket соединение установлено');
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML += `<div><b>${msg.username}:</b> ${msg.text} <small>(${msg.timestamp})</small></div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    };
    ws.onclose = () => console.log('WebSocket закрыт');
    ws.onerror = (err) => console.error('WebSocket ошибка', err);
}

function sendMessage() {
    const text = document.getElementById('message').value.trim();
    if (text && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ text }));
        document.getElementById('message').value = '';
    } else {
        alert('Соединение не установлено. Попробуйте перезагрузить страницу.');
    }
}

function logout() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    localStorage.removeItem('chatToken');
    jwtToken = null;
    ws = null;
    document.getElementById('chat-app').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('chat-box').innerHTML = '';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-error').innerText = '';
    document.getElementById('login-error').innerText = '';
}

window.onload = () => {
    const savedToken = localStorage.getItem('chatToken');
    if (savedToken) {
        jwtToken = savedToken;
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('chat-app').classList.remove('hidden');
        connectWebSocket();
    } else {
        showRegister();
    }
};