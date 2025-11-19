// ------------------ LOGIN / REGISTER ------------------
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

// ------------------ POSTS ------------------
if (document.getElementById("postsList")) {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "login.html";

    const loadPosts = async () => {
        const res = await fetch("http://127.0.0.1:8000/api/posts/");
        const data = await res.json();
        const ul = document.getElementById("postsList");
        ul.innerHTML = "";

        data.forEach(post => {
            const li = document.createElement("li");
            li.textContent = `${post.title} (${post.author}): ${post.content}`;

            // кнопка удаления
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.style.marginLeft = "10px";
            delBtn.addEventListener("click", async () => {
                const res = await fetch(`http://127.0.0.1:8000/api/posts/${post.id}/`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": "Token " + token
                    }
                });
                if (res.ok) loadPosts();
                else alert("Ошибка удаления");
            });

            li.appendChild(delBtn);
            ul.appendChild(li);
        });
    };

    loadPosts();

    document.getElementById("postForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("postTitle").value;
        const content = document.getElementById("postContent").value;
        const author = document.getElementById("postAuthor").value;

        const res = await fetch("http://127.0.0.1:8000/api/posts/", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Token " + token
            },
            body: JSON.stringify({ title, content, author })
        });

        if (res.ok) {
            loadPosts();
            document.getElementById("postTitle").value = "";
            document.getElementById("postContent").value = "";
            document.getElementById("postAuthor").value = "";
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
