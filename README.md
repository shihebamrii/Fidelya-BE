# Loyalty Card SaaS Backend

A production-ready Express.js backend for managing loyalty cards. Supports three roles: `admin`, `business`, and `client`. Features JWT authentication, role-based access control, QR code generation, and atomic MongoDB transactions.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest, mongodb-memory-server

## Quick Start

### 1. Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 2. Installation

```bash
cd Backend
npm install
```

### 3. Configuration

Copy the environment template and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/loyalty
JWT_SECRET=your_secure_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
ADMIN_DEFAULT_EMAIL=admin@yourdomain.com
ADMIN_DEFAULT_PASSWORD=SecurePass123!
```

### 4. Seed Database

Create the initial admin user and demo data:

```bash
npm run seed
```

### 5. Run the Server

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

### 6. Access the API

- **API Base URL**: http://localhost:4000
- **Swagger Docs**: http://localhost:4000/api-docs
- **Health Check**: http://localhost:4000/healthz

## API Overview

### Authentication

| Method | Endpoint            | Description            |
| ------ | ------------------- | ---------------------- |
| POST   | `/api/auth/login`   | Login (returns tokens) |
| POST   | `/api/auth/refresh` | Refresh access token   |
| POST   | `/api/auth/logout`  | Revoke refresh token   |

### Admin Endpoints (requires admin role)

| Method | Endpoint                            | Description           |
| ------ | ----------------------------------- | --------------------- |
| POST   | `/api/admin/businesses`             | Create business       |
| GET    | `/api/admin/businesses`             | List businesses       |
| POST   | `/api/admin/businesses/:id/users`   | Create business user  |
| POST   | `/api/admin/businesses/:id/clients` | Create client + QR    |
| GET    | `/api/admin/businesses/:id/clients` | List clients          |
| GET    | `/api/admin/transactions`           | View all transactions |

### Business Endpoints (requires business_user role)

| Method | Endpoint                           | Description                |
| ------ | ---------------------------------- | -------------------------- |
| POST   | `/api/business/items`              | Create earn/redeem item    |
| GET    | `/api/business/items`              | List items                 |
| POST   | `/api/business/clients/:id/points` | Add/deduct points via item |
| POST   | `/api/business/clients/:id/manual` | Manual point adjustment    |
| GET    | `/api/business/clients/:id`        | Get client profile         |
| GET    | `/api/business/clients/search`     | Search clients             |
| GET    | `/api/business/transactions`       | List transactions          |

### Public Client Endpoints

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| GET    | `/api/client/:clientId`    | View dashboard (read-only) |
| GET    | `/api/client/:clientId/qr` | Get QR code                |

## Project Structure

```
Backend/
├── src/
│   ├── config/          # Database and logger config
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, rate limiting
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── validators/      # Joi schemas
│   ├── tests/           # Test files
│   └── app.js           # Application entry point
├── scripts/
│   └── seed.js          # Database seeding
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Running with Docker

Build and run:

```bash
docker-compose up --build
```

Or build manually:

```bash
docker build -t loyalty-backend .
docker run -p 4000:4000 --env-file .env loyalty-backend
```

## Testing

Run all tests:

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

## Scripts

| Script         | Description             |
| -------------- | ----------------------- |
| `npm start`    | Start production server |
| `npm run dev`  | Start with hot reload   |
| `npm test`     | Run tests               |
| `npm run seed` | Seed database           |
| `npm run lint` | Run ESLint              |

## Environment Variables

| Variable                 | Description               | Default       |
| ------------------------ | ------------------------- | ------------- |
| `PORT`                   | Server port               | `4000`        |
| `NODE_ENV`               | Environment               | `development` |
| `MONGODB_URI`            | MongoDB connection string | -             |
| `JWT_SECRET`             | JWT signing secret        | -             |
| `JWT_EXPIRES_IN`         | Access token expiry       | `15m`         |
| `JWT_REFRESH_SECRET`     | Refresh token secret      | -             |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry      | `7d`          |
| `ADMIN_DEFAULT_EMAIL`    | Default admin email       | -             |
| `ADMIN_DEFAULT_PASSWORD` | Default admin password    | -             |
| `CLIENT_DASHBOARD_URL`   | QR code URL base          | -             |

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT with short-lived access tokens
- Refresh token rotation
- Role-based access control
- Rate limiting per endpoint type
- Input sanitization (XSS, NoSQL injection)
- Helmet security headers
- CORS configuration

## License

ISC
