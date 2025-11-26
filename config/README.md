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

## Требования

Зависимости перечислены в `requirements.txt`.

Если нужно — могу помочь:
- настроить передачу токена в заголовке для WebSocket (middleware),
- подключить Redis для Channels,
- подготовить инструкцию для деплоя.
