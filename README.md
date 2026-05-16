# First Traffic Platform - DSP for RTB Traffic Arbitrage 🚀

Production-ready **Demand-Side Platform (DSP)** для **Real-Time Bidding (RTB)** трафик-арбитража. Автоматизируйте закупку медийной рекламы, управляйте кампаниями и оптимизируйте ROI в реальном времени.

## 🎯 Основные возможности

- ✅ **RTB Engine** - Real-time bidding с умной оптимизацией ставок
- ✅ **Многоканальный трафик** - Hilltop Ads, Clickadilla, Telegram Mini Apps
- ✅ **Управление кампаниями** - создание, запуск, пауза кампаний
- ✅ **Умные стратегии ставок** - ROI_OPTIMIZED, CPA, CPM, CPC
- ✅ **Real-time аналитика** - отслеживание impressions, clicks, conversions
- ✅ **JWT аутентификация** - безопасный доступ к API
- ✅ **PostgreSQL БД** - надёжное хранилище данных

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 13+

### Установка и запуск

```bash
# 1. Клонируем репозиторий
git clone https://github.com/Aloews/first-traffic-platform.git
cd first-traffic-platform

# 2. Устанавливаем зависимости
npm install

# 3. Копируем конфиг переменных
cp .env.example .env

# 4. Запускаем Docker контейнеры
docker-compose up -d

# 5. Запускаем приложение в режиме разработки
npm run dev
```

**Server**: `http://localhost:3000`

## 📡 API Документация

### 🔐 Аутентификация
```
POST /api/auth/register     - Регистрация пользователя
POST /api/auth/login        - Вход в систему
```

### 📢 Кампании
```
POST   /api/campaigns           - Создать кампанию
GET    /api/campaigns           - Получить все кампании
GET    /api/campaigns/{id}      - Получить кампанию по ID
POST   /api/campaigns/{id}/launch - Запустить кампанию
POST   /api/campaigns/{id}/pause  - Приостановить кампанию
```

### 🎯 RTB (Real-Time Bidding)
```
POST /api/rtb/bid                  - Разместить ставку
POST /api/rtb/impression/{id}      - Отследить impression
POST /api/rtb/click/{id}           - Отследить click
POST /api/rtb/conversion/{id}      - Отследить conversion
```

### 📊 Аналитика
```
GET /api/analytics/stats      - Статистика дашборда
GET /api/analytics/range      - Аналитика по диапазону дат
```

## 📊 Технический стек

| Компонент | Версия/Описание |
|-----------|-----------------|
| **Runtime** | Node.js 18+ |
| **Язык** | TypeScript |
| **Фреймворк** | Express.js |
| **БД** | PostgreSQL 13+ |
| **ORM** | TypeORM |
| **Аутентификация** | JWT (JSON Web Token) |
| **Контейнеризация** | Docker & Docker Compose |

## 📁 Структура проекта

```
first-traffic-platform/
├── src/
│   ├── controllers/        # API контроллеры
│   ├── services/           # Бизнес-логика
│   ├── entities/           # TypeORM сущности
│   ├── routes/             # Маршруты API
│   ├── middleware/         # Middleware (auth, validation)
│   └── app.ts              # Основное приложение
├── docker-compose.yml      # Docker конфигурация
├── .env.example            # Пример переменных окружения
├── package.json            # Зависимости проекта
└── tsconfig.json           # TypeScript конфигурация
```

## 🔧 Стратегии оптимизации ставок

| Стратегия | Описание |
|-----------|---------|
| **ROI_OPTIMIZED** | Максимизация ROI (возврат инвестиций) |
| **CPA** | Cost Per Action - оплата за целевое действие |
| **CPM** | Cost Per Mille - оплата за 1000 impressions |
| **CPC** | Cost Per Click - оплата за клик |

## 📋 Переменные окружения (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=traffic_platform

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=24h

# RTB
RTB_MIN_BID=0.01
RTB_MAX_BID=100
```

## 🤝 Контрибьюции

Приветствуем вклады в проект! Если вы хотите помочь:

1. Fork репозиторий
2. Создайте ветку для вашей фичи (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под **MIT License** - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Контакты и поддержка

- **GitHub**: [Aloews](https://github.com/Aloews)
- **Issues**: [Сообщить об ошибке](https://github.com/Aloews/first-traffic-platform/issues)

---

**Сделано с ❤️ для оптимизации RTB трафик-арбитража**
