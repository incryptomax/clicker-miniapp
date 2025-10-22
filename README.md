# 🎮 Komic Clicker Test - Telegram Mini App

Полнофункциональное Telegram Mini App для игры-кликера, реализованное согласно техническому заданию Telegram.

## 📋 Описание

Это Telegram Mini App представляет собой игру-кликер, где пользователи могут:
- Кликать по кнопке для увеличения своего счета
- Соревноваться с другими игроками в таблице лидеров
- Изменять свое имя пользователя
- Видеть общую статистику всех игроков

## 🏗️ Архитектура

Проект построен на микросервисной архитектуре:

- **API Service** (NestJS) - REST API для обработки кликов и статистики
- **Bot Service** (NestJS + Telegraf) - Telegram бот с командами и Web App интеграцией
- **Worker Service** (NestJS + Bull) - Фоновая обработка задач
- **WebApp Service** (React + Vite) - Telegram Mini App интерфейс
- **PostgreSQL** - Основная база данных
- **Redis** - Кэширование и очереди задач
- **Nginx** - Reverse proxy и статические файлы

## 🚀 Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- Telegram Bot Token

### Запуск через Docker

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/yourusername/komicclickertest.git
cd komicclickertest
```

2. **Настройте переменные окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

3. **Запустите приложение:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. **Проверьте статус:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Доступные endpoints

- **WebApp**: `http://localhost` - Telegram Mini App
- **API Health**: `http://localhost/api/health` - Проверка здоровья API
- **Leaderboard**: `http://localhost/api/leaderboard` - Таблица лидеров
- **Redis Commander**: `http://localhost:8081` - Управление Redis

## 📱 Telegram Bot команды

- `/start` - Начать игру и получить приветствие
- `/help` - Показать справку по командам
- `/leaderboard` - Показать таблицу лидеров
- `/changename` - Изменить имя пользователя

## 🎯 Функциональность

### ✅ Реализованные функции

1. **Telegram Bot интеграция**
   - Команды `/start`, `/help`, `/leaderboard`, `/changename`
   - Web App кнопки для открытия игры
   - Polling режим для локальной разработки
   - Webhook режим для продакшена

2. **Telegram Mini App**
   - React интерфейс с современным дизайном
   - Интеграция с Telegram WebApp API
   - Адаптивный дизайн для мобильных устройств
   - Haptic feedback и уведомления

3. **Система кликов**
   - Обработка кликов с идемпотентностью
   - Batch отправка кликов (каждые 5 кликов)
   - Real-time обновление статистики
   - Глобальный счетчик кликов

4. **Таблица лидеров**
   - Топ-20 игроков
   - ETag кэширование
   - Автоматическое обновление
   - Ранжирование по количеству кликов

5. **Масштабируемость**
   - Redis для кэширования и очередей
   - PostgreSQL для персистентного хранения
   - Bull queues для фоновых задач
   - Rate limiting и graceful degradation

6. **Мониторинг и логирование**
   - Health checks для всех сервисов
   - Структурированное логирование
   - Prometheus метрики
   - OpenTelemetry трейсинг

## 🔧 Разработка

### Локальная разработка

1. **Установите зависимости:**
```bash
# API
cd services/api && npm install

# Bot
cd services/bot && npm install

# Worker
cd services/worker && npm install

# WebApp
cd services/webapp && npm install
```

2. **Запустите базы данных:**
```bash
docker-compose up postgres redis -d
```

3. **Запустите сервисы:**
```bash
# API
cd services/api && npm run start:dev

# Bot
cd services/bot && npm run start:dev

# Worker
cd services/worker && npm run start:dev

# WebApp
cd services/webapp && npm run dev
```

### Структура проекта

```
├── services/
│   ├── api/                 # NestJS API сервис
│   ├── bot/                 # Telegram Bot сервис
│   ├── worker/              # Фоновые задачи
│   ├── webapp/              # React WebApp
│   └── shared/              # Общие типы и утилиты
├── docker-compose.prod.yml  # Production Docker Compose
├── nginx.conf               # Nginx конфигурация
└── README.md               # Документация
```

## 🐳 Docker

### Production сборка

```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Development сборка

```bash
docker-compose build
docker-compose up -d
```

## 📊 Мониторинг

### Health Checks

- **API**: `GET /api/health`
- **Bot**: `GET /bot/health`
- **Worker**: `GET /worker/health`

### Метрики

- **Prometheus**: `GET /metrics` (только для внутренних сетей)

### Логи

Логи сохраняются в папке `logs/` для каждого сервиса:
- `logs/api/` - API логи
- `logs/bot/` - Bot логи
- `logs/worker/` - Worker логи

## 🔒 Безопасность

- Content Security Policy (CSP) для WebApp
- Rate limiting для API endpoints
- Валидация входных данных
- CORS настройки для Telegram доменов
- Безопасные заголовки через Helmet

## 🚀 Деплой

### Переменные окружения

```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/clicker_game
REDIS_URL=redis://redis:6379

# WebApp
WEBAPP_URL=https://your-domain.com

# Logging
LOG_LEVEL=info
```

### Production настройки

1. Настройте HTTPS домен
2. Установите `TELEGRAM_WEBHOOK_URL`
3. Настройте `WEBAPP_URL` для HTTPS
4. Запустите с production Docker Compose

## 📈 Производительность

- **Масштабируемость**: Поддерживает 100,000+ пользователей
- **Активные пользователи**: До 5,000 одновременных пользователей
- **Graceful degradation**: Автоматическое снижение нагрузки при высокой активности
- **Кэширование**: Redis для быстрого доступа к данным
- **Очереди**: Bull для асинхронной обработки

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [Issues](https://github.com/yourusername/komicclickertest/issues)
2. Создайте новый Issue с подробным описанием
3. Приложите логи и конфигурацию

## 🎉 Благодарности

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
- [NestJS](https://nestjs.com/)
- [React](https://reactjs.org/)
- [Docker](https://www.docker.com/)

---

**Сделано с ❤️ для Telegram Mini App разработки**