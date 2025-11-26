# Проект: SocialHub (Django + DRF)

Это небольшой проект — REST API с функционалом публикации постов и онлайн-чата.

Поддерживаемые части:
- Пользователи (регистрация, токенная аутентификация)
- CRUD для постов
- Реaltime-чат (через WebSocket / Django Channels)

## Быстрый старт (локально)

1. Клонировать репозиторий и перейти в папку `config`:

```bash
git clone <repo>
cd "$(pwd)/config"
```

2. Создать и активировать виртуальное окружение (пример):

```bash
python3 -m venv ../venv
source ../venv/bin/activate
```

3. Установить зависимости:

```bash
pip install -r requirements.txt
```

4. Применить миграции и создать суперпользователя при необходимости:

```bash
python manage.py migrate
python manage.py createsuperuser
```

5. Запустить сервер разработки (ASGI, Channels поддерживается):

```bash
python manage.py runserver 0.0.0.0:8000
```

6. Подать фронтенд (в `config/frontend`) можно через `python -m http.server 5500` или через Live Server в редакторе (но отключите авто-reload для `db.sqlite3`).

## WebSocket чат

- WebSocket endpoint (локально):
	`ws://127.0.0.1:8000/ws/messaging/conversations/<conversation_id>/?token=<user_token>`
- Аутентификация в WebSocket реализована через query-параметр `token` (удобно для разработки). В проде рекомендую использовать `wss` и передачу токена через заголовки и безопасную auth‑middleware.
- Для продакшна используйте Redis + `channels_redis` в `CHANNEL_LAYERS`.

## Что внутри и куда смотреть

- `messaging/consumers.py` — WebSocket consumer (сохранение сообщений и broadcast)
- `config/asgi.py`, `config/routing.py` — маршрутизация websocket
- `frontend/app.js` — клиент WebSocket + оптимистичный UI

# Проект: SocialHub (Django + DRF)

Это небольшой проект — REST API с функционалом публикации постов и онлайн-чата.

Поддерживаемые части:
 - Пользователи (регистрация, токенная аутентификация)
 - CRUD для постов
 - Реaltime-чат (через WebSocket / Django Channels)

## Как запустить

1) Подготовка окружения

- Клонируйте репозиторий и перейдите в папку `config`:

```bash
git clone https://github.com/zetaEA/crud-api.git
cd "crud-api/config"
```

- Создайте и активируйте виртуальное окружение (пример):

```bash
python3 -m venv ../venv
source ../venv/bin/activate
```

2) Установка зависимостей

Установите зависимости из `requirements.txt`:

```bash
pip install -r requirements.txt
```

3) Миграции и запуск

Примените миграции и запустите сервер:

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

4) Фронтенд (локально)

Файлы фронтенда находятся в `config/frontend`. Для разработки можно использовать простой статический сервер (рекомендуется отключить Live Server в VS Code, чтобы избежать авто‑перезагрузки при изменениях в `db.sqlite3`):

```bash
cd frontend
python3 -m http.server 5500
# Откройте http://127.0.0.1:5500/chat.html
```

5) Аутентификация

- Регистрация: `POST /api/users/register/`
- Вход (получение токена): `POST /api-token-auth/` с полями `username` и `password`. Токен сохраняется в `localStorage` фронтенда.

6) Чат (WebSocket)

Проект поддерживает WebSocket через Django Channels. В development используется in‑memory channel layer, для продакшна рекомендуется Redis.

- WebSocket URL (dev):
	`ws://127.0.0.1:8000/ws/messaging/conversations/<conversation_id>/?token=<your_token>`

- Клиентский код (в `frontend/app.js`) при открытии диалога подключается к WebSocket и получает/отправляет сообщения в реальном времени. Если WebSocket недоступен, используется HTTP fallback (POST к `/api/messaging/conversations/<id>/messages/`).

7) Примечания и рекомендации

- Текущая аутентификация WebSocket реализована через query param `token` — это удобно для разработки, но в продакшне лучше реализовать безопасную авторизацию (например, по заголовку `Authorization` и использовать `wss`).
- Для многопроцессного развёртывания и масштабирования используйте `channels_redis` и Redis как бекенд channel layer.
- Если Live Server VS Code вызывает автоматическую перезагрузку страницы при локальных изменениях в базе (`db.sqlite3`), остановите Live Server или добавьте исключения в его настройки.

Если нужно — могу подготовить инструкцию по деплою (Gunicorn/Uvicorn + Daphne/nginx + Redis) и помочь переключить WebSocket‑аутентификацию на безопасный вариант.
