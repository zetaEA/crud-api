console.log("app.js loaded!");

// Ловушка на перезагрузку и редиректы
window.addEventListener('beforeunload', (e) => {
    console.warn("PAGE RELOAD/REDIRECT DETECTED!", new Error().stack);
});

// ===== GLOBAL HELPERS =====
let currentUserId = null;
let currentConversationId = null;
let loadedMessageIds = new Set(); // Для отслеживания загруженных сообщений

const checkTokenValidity = async (token) => {
    if (!token) return false;
    try {
        const res = await fetch("http://127.0.0.1:8000/api/users/me/", {
            headers: {"Authorization": "Token " + token}
        });
        return res.ok;
    } catch (e) {
        return false;
    }
};

const smartRedirectToLogin = async () => {
    console.log("smartRedirectToLogin called");
    const token = localStorage.getItem("token");
    const isValid = await checkTokenValidity(token);
    console.log("Token valid?", isValid);
    if (!isValid) {
        console.log("Token invalid, redirecting to login");
        localStorage.removeItem("token");
        window.location.href = "login.html";
    }
};

// ===== PROTECT PAGES =====
// Проверяем наличие токена при загрузке страницы (кроме login.html)
if (!window.location.pathname.includes("login.html") && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
        const token = localStorage.getItem("token");
        if (!token) window.location.href = "login.html";
    });
}

// ===== LOGIN / REGISTER =====
if (document.getElementById("registerForm")) {
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const res = await fetch("http://127.0.0.1:8000/api/users/register/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: document.getElementById("regUsername").value,
                password: document.getElementById("regPassword").value
            })
        });
        const data = await res.json();
        alert("User registered: " + JSON.stringify(data));
    });

    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const res = await fetch("http://127.0.0.1:8000/api-token-auth/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: document.getElementById("loginUsername").value,
                password: document.getElementById("loginPassword").value
            })
        });
        const data = await res.json();
        if(data.token){
            localStorage.setItem("token", data.token);
            window.location.href = "posts.html"; // переходим на основной пейдж
        } else {
            alert("Ошибка логина: " + JSON.stringify(data));
        }
    });
}

// ===== POSTS =====
if (document.getElementById("postsList")) {
    const token = localStorage.getItem("token");
    if (!token) {
        smartRedirectToLogin();
    }

    const loadPosts = async () => {
        const res = await fetch("http://127.0.0.1:8000/api/posts/");
        const data = await res.json();
        const container = document.getElementById("postsList");
        container.innerHTML = "";

        const posts = data.results ? data.results : data;

        if (posts.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">Нет постов. Будьте первым! 🎉</div>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement("div");
            card.className = "post-card";
            card.innerHTML = `
                <div class="post-author">✍️ ${post.author}</div>
                <div class="post-title">${post.title}</div>
                <div class="post-content">${post.content}</div>
                <div class="post-date">📅 ${new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
                <div class="post-actions">
                    <button class="btn-danger btn-small delete-btn" data-id="${post.id}">🗑️ Удалить</button>
                </div>
            `;
            container.appendChild(card);
        });

        // Attach delete handlers
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Вы уверены?')) return;
                const postId = btn.getAttribute('data-id');
                const res = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/`, {
                    method: "DELETE",
                    headers: { "Authorization": "Token " + token }
                });
                if (res.ok) loadPosts();
                else alert("Ошибка удаления");
            });
        });
    };

    loadPosts();

    document.getElementById("postForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("postTitle").value;
        const content = document.getElementById("postContent").value;

        const res = await fetch("http://127.0.0.1:8000/api/posts/", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            },
            body: JSON.stringify({ title, content })
        });

        if (res.ok) {
            loadPosts();
            document.getElementById("postTitle").value = "";
            document.getElementById("postContent").value = "";
        } else {
            const error = await res.json();
            alert("Ошибка: " + JSON.stringify(error));
        }
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });
}

// ===== CHAT =====
if (document.getElementById("messagesList")) {
    const token = localStorage.getItem("token");
    if (!token) {
        smartRedirectToLogin();
    }

    // Получаем информацию о текущем пользователе
    const fetchCurrentUser = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/users/me/", {
                headers: {"Authorization": "Token " + token}
            });
            if (res.ok) {
                const json = await res.json();
                currentUserId = json.id;
            }
        } catch (e) {
            console.error('Failed to fetch current user', e);
        }
    };

    const loadConversations = async () => {
        const res = await fetch("http://127.0.0.1:8000/api/messaging/conversations/", {
            headers: {"Authorization": "Token " + token}
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = document.getElementById("conversationsList");
        list.innerHTML = "";

        const conversations = data.results ? data.results : data;

        conversations.forEach(conv => {
            const div = document.createElement("div");
            div.className = "conversation-item";

            const otherUser = conv.participants.find(p => p.id !== currentUserId) || conv.participants[0];
            const lastMsg = conv.last_message ? conv.last_message.text.substring(0, 30) : "Нет сообщений";

            div.textContent = `${otherUser.username}: ${lastMsg}`;
            div.addEventListener('click', () => openConversation(conv.id, otherUser.username, div));
            list.appendChild(div);
        });
    };

    let socket = null;
    const openConversation = async (convId, participantName, element) => {
        // close previous socket if any
        if (socket) {
            try { socket.close(); } catch(e) {}
            socket = null;
        }

        currentConversationId = convId;
        loadedMessageIds.clear(); // Очищаем набор загруженных сообщений при смене диалога
        document.getElementById("messagesList").innerHTML = ""; // Очищаем список сообщений в UI
        document.getElementById("currentChatTitle").textContent = `Чат с ${participantName}`;
        document.getElementById("messageInputArea").style.display = "flex";

        document.querySelectorAll(".conversation-item").forEach(item => item.classList.remove("active"));
        if (element) element.classList.add("active");

        // load existing messages once
        await loadMessages();

        // open websocket for real-time messages
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://127.0.0.1:8000/ws/messaging/conversations/${currentConversationId}/?token=${token}`;
        socket = new WebSocket(wsUrl);

        socket.addEventListener('open', () => {
            console.log('WebSocket connected to', wsUrl);
        });

        socket.addEventListener('message', (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                // avoid duplicates
                if (loadedMessageIds.has(msg.id)) return;
                loadedMessageIds.add(msg.id);

                const list = document.getElementById('messagesList');
                const div = document.createElement('div');
                const isSent = msg.sender_id && Number(msg.sender_id) === Number(currentUserId);
                div.className = isSent ? 'message sent' : 'message received';
                div.textContent = isSent ? `You: ${msg.text}` : `${msg.sender_username || msg.sender}: ${msg.text}`;
                list.appendChild(div);
                list.scrollTop = list.scrollHeight;
            } catch (err) {
                console.error('WS message parse error', err);
            }
        });

        socket.addEventListener('close', (e) => {
            console.log('WebSocket closed', e);
            socket = null;
        });
    };

    const loadMessages = async () => {
        if (!currentConversationId) return;

        const res = await fetch(
            `http://127.0.0.1:8000/api/messaging/conversations/${currentConversationId}/messages/`,
            {headers: {"Authorization": "Token " + token}}
        );
        if (!res.ok) return;
        const data = await res.json();
        const list = document.getElementById("messagesList");

        const messages = data.results ? data.results : data;
        let hasNewMessages = false;

        messages.forEach(msg => {
            // Если сообщение уже было загружено - не добавляем его снова
            if (loadedMessageIds.has(msg.id)) return;
            
            loadedMessageIds.add(msg.id);
            hasNewMessages = true;

            const div = document.createElement("div");
            // Сравниваем по ID числами
            const isSent = msg.sender_id && Number(msg.sender_id) === Number(currentUserId);
            div.className = isSent ? "message sent" : "message received";
            div.textContent = isSent ? `You: ${msg.text}` : `${msg.sender_username || msg.sender}: ${msg.text}`;
            list.appendChild(div);
        });

        // Скролим только если были новые сообщения
        if (hasNewMessages) {
            list.scrollTop = list.scrollHeight;
        }
    };

    let isSending = false;
    window.sendMessage = async (e) => {
        if (e) { e.preventDefault && e.preventDefault(); e.stopPropagation && e.stopPropagation(); }
        console.log("sendMessage called, e:", e);
        
        const textEl = document.getElementById("messageInput");
        const text = textEl.value;
        if (!text.trim() || !currentConversationId) return;
        if (isSending) return;
        isSending = true;

        // Добавляем сообщение локально сразу (оптимистичное обновление)
        const messagesList = document.getElementById("messagesList");
        const div = document.createElement("div");
        div.className = "message sent";
        div.textContent = `You: ${text}`;
        messagesList.appendChild(div);
        messagesList.scrollTop = messagesList.scrollHeight;
        
        console.log("Local message added to UI");

        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ text }));
                textEl.value = "";
            } else {
                // Fallback to HTTP POST if websocket is not available
                const res = await fetch(
                    `http://127.0.0.1:8000/api/messaging/conversations/${currentConversationId}/messages/`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        },
                        body: JSON.stringify({text})
                    }
                );
                if (res.ok) {
                    textEl.value = "";
                } else {
                    div.remove();
                    let errText = '';
                    try { const json = await res.json(); errText = JSON.stringify(json); } catch (err) { errText = await res.text(); }
                    console.error('Send message failed', res.status, errText);
                }
            }
        } catch (err) {
            div.remove();
            console.error('Send message error', err);
        } finally {
            isSending = false;
        }
    };

    // search/create conversation
    window.searchAndOpenChat = async () => {
        const userId = document.getElementById("userSearchInput").value;
        if (!userId) { alert("Введите ID пользователя"); return; }

        const res = await fetch(
            "http://127.0.0.1:8000/api/messaging/conversations/get_or_create/",
            {
                method: "POST",
                headers: {"Content-Type": "application/json", "Authorization": "Token " + token},
                body: JSON.stringify({user_id: userId})
            }
        );

        if (res.ok) {
            const conv = await res.json();
            await loadConversations();
            const otherUser = conv.participants.find(p => p.id != currentUserId) || conv.participants[0];
            openConversation(conv.id, otherUser.username);
        } else if (res.status === 401) {
            alert("Сессия истекла. Пожалуйста, войдите снова.");
            await smartRedirectToLogin();
        } else {
            alert("Пользователь не найден или ошибка при создании чата");
        }
    };

    // attach button handlers
    const sendBtnEl = document.getElementById('sendBtn');
    if (sendBtnEl) sendBtnEl.addEventListener('click', (e) => window.sendMessage(e));
    const searchBtnEl = document.getElementById('searchBtn');
    if (searchBtnEl) searchBtnEl.addEventListener('click', (e) => { e.preventDefault(); window.searchAndOpenChat(); });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    // init
    (async () => { await fetchCurrentUser(); await loadConversations(); })();

    // polling for new conversations (every 5 seconds)
    setInterval(() => { loadConversations(); }, 5000);
    
    // polling for new messages in current conversation (only if conversation is open)
    setInterval(() => { 
        if (currentConversationId) loadMessages(); 
    }, 3000);
}
