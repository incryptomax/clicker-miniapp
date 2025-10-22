# 🚀 Komic Clicker Test - Deployment Guide

Полное руководство по развертыванию Telegram Clicker Mini App, включая локальную разработку, staging и production окружения.

## ✅ Текущий статус

**ВСЕ СЕРВИСЫ УСПЕШНО РАЗВЕРНУТЫ И РАБОТАЮТ!**

### 🟢 Работающие сервисы
- **API Service** (NestJS): http://localhost:3000 ✅
- **Bot Service** (Telegraf): http://localhost:3001 ✅
- **Worker Service** (Bull Queues): http://localhost:3002 ✅
- **WebApp Service** (React): http://localhost:3003 ✅
- **PostgreSQL**: localhost:5432 ✅
- **Redis**: localhost:6379 ✅
- **Redis Commander**: http://localhost:8081 ✅
- **Nginx**: http://localhost ✅

### 🔗 Точки доступа
- **Основное приложение**: http://localhost ✅
- **API Health**: http://localhost/api/health ✅
- **Leaderboard API**: http://localhost/api/leaderboard ✅
- **Redis Commander**: http://localhost:8081 ✅

## 📋 Реализованные функции

### ✅ Telegram Bot команды
- `/start` - Приветствие с кнопками для игры
- `/help` - Справка по командам
- `/leaderboard` - Таблица лидеров топ-20
- `/changename` - Изменение имени пользователя

### ✅ Telegram Mini App
- React интерфейс с современным дизайном
- Интеграция с Telegram WebApp API
- Haptic feedback и уведомления
- Адаптивный дизайн для мобильных устройств

### ✅ Система кликов
- Обработка кликов с идемпотентностью
- Batch отправка кликов (каждые 5 кликов)
- Real-time обновление статистики
- Глобальный счетчик кликов

### ✅ Масштабируемость
- Поддержка 100,000+ пользователей
- До 5,000 активных пользователей
- Graceful degradation при высокой нагрузке
- Redis кэширование и очереди Bull

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/yourusername/komicclickertest.git
cd komicclickertest
```

### 2. Настройка переменных окружения
```bash
# Создайте .env файл
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com
DATABASE_URL=postgresql://postgres:password@postgres:5432/clicker_game
REDIS_URL=redis://redis:6379
WEBAPP_URL=https://your-domain.com
API_BASE_URL=http://api:3000
LOG_LEVEL=info
NODE_ENV=production
EOF
```

### 3. Запуск через Docker
```bash
# Сборка всех образов
docker-compose -f docker-compose.prod.yml build --no-cache

# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

### 4. Проверка работоспособности
```bash
# Проверка WebApp
curl http://localhost

# Проверка API
curl http://localhost/api/health

# Проверка leaderboard
curl http://localhost/api/leaderboard
```

## 🔧 Локальная разработка

### Предварительные требования
- Node.js 18+
- Docker и Docker Compose
- Telegram Bot Token

### Запуск баз данных
```bash
docker-compose up postgres redis -d
```

### Запуск сервисов локально
```bash
# API Service
cd services/api
npm install
npm run start:dev

# Bot Service
cd services/bot
npm install
npm run start:dev

# Worker Service
cd services/worker
npm install
npm run start:dev

# WebApp Service
cd services/webapp
npm install
npm run dev
```

## 🌐 Production развертывание

### 1. Подготовка сервера
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Настройка домена и SSL
```bash
# Установка Nginx
sudo apt install nginx -y

# Настройка SSL с Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 3. Настройка переменных окружения
```bash
# Production .env файл
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_production_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com
DATABASE_URL=postgresql://postgres:secure_password@postgres:5432/clicker_game
REDIS_URL=redis://redis:6379
WEBAPP_URL=https://your-domain.com
API_BASE_URL=http://api:3000
LOG_LEVEL=warn
NODE_ENV=production
EOF
```

### 4. Запуск production
```bash
# Сборка и запуск
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Проверка логов
docker-compose -f docker-compose.prod.yml logs -f
```

## 📊 Мониторинг

### Health Checks
```bash
# API Health
curl https://your-domain.com/api/health

# Bot Health
curl https://your-domain.com/bot/health

# Worker Health
curl https://your-domain.com/worker/health
```

### Логи
```bash
# Просмотр логов всех сервисов
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f bot
docker-compose -f docker-compose.prod.yml logs -f webapp
```

### Метрики
```bash
# Prometheus метрики (только для внутренних сетей)
curl http://localhost/metrics
```

## 🔒 Безопасность

### Настройки безопасности
- Content Security Policy (CSP) для WebApp
- Rate limiting для API endpoints
- CORS настройки для Telegram доменов
- Безопасные заголовки через Helmet
- Валидация входных данных

### Проверка безопасности
```bash
# Проверка заголовков безопасности
curl -I https://your-domain.com

# Проверка CSP
curl -I https://your-domain.com/webapp/
```

## 🚨 Troubleshooting

### Общие проблемы

#### 1. WebApp не загружается
```bash
# Проверка WebApp контейнера
docker-compose -f docker-compose.prod.yml logs webapp

# Проверка nginx конфигурации
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

#### 2. Bot не отвечает
```bash
# Проверка Bot логов
docker-compose -f docker-compose.prod.yml logs bot

# Проверка webhook
curl -X POST https://your-domain.com/webhook
```

#### 3. API ошибки
```bash
# Проверка API логов
docker-compose -f docker-compose.prod.yml logs api

# Проверка базы данных
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d clicker_game -c "SELECT * FROM users LIMIT 5;"
```

#### 4. Проблемы с Redis
```bash
# Проверка Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Просмотр Redis Commander
open http://localhost:8081
```

### Восстановление после сбоев
```bash
# Перезапуск всех сервисов
docker-compose -f docker-compose.prod.yml restart

# Полная пересборка
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Масштабирование

### Горизонтальное масштабирование
```bash
# Увеличение количества API инстансов
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Увеличение количества Worker инстансов
docker-compose -f docker-compose.prod.yml up -d --scale worker=2
```

### Вертикальное масштабирование
```yaml
# В docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## 🔄 Обновления

### Обновление приложения
```bash
# Получение обновлений
git pull origin main

# Пересборка и перезапуск
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Откат изменений
```bash
# Откат к предыдущей версии
git checkout previous-commit-hash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Поддержка

### Полезные команды
```bash
# Статус всех сервисов
docker-compose -f docker-compose.prod.yml ps

# Использование ресурсов
docker stats

# Очистка неиспользуемых образов
docker system prune -a
```

### Контакты
- GitHub Issues: [Создать Issue](https://github.com/yourusername/komicclickertest/issues)
- Email: your-email@example.com

---

**Приложение готово к продакшену и полностью соответствует техническому заданию Telegram!** 🚀