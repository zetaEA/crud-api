# Django DRF Project

Мини-проект API с CRUD

## Как запустить

1. Клонировать репозиторий
2. Создать виртуальное окружение
3. Установить зависимости: `pip install -r requirements.txt`
4. Применить миграции: `python manage.py migrate`
5. Запустить сервер: `python manage.py runserver`

## Эндпоинты API

- `POST /api/users/register/` — регистрация
- `POST /api-token-auth/` — получение токена
- `GET /api/posts/` — получить все посты
- `POST /api/posts/` — создать пост (требуется токен)
