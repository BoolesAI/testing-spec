# TSpec Demo - Bookstore API Demo

A demonstration bookstore management API for showcasing TSpec testing capabilities.

> **Note**: This module is designed specifically for **TSpec functionality demonstration**. It provides a real-world API implementation with comprehensive TSpec test cases to illustrate the framework's features.

## Purpose

The demo module serves as a live testing target for TSpec, demonstrating:

- HTTP CRUD operations testing
- Request/response validation
- Error handling and negative test cases
- Pagination and query parameter testing
- Data extraction and variable usage

## Tech Stack

- **Runtime**: Node.js >= 20.19.0
- **Framework**: Koa.js
- **Database**: SQLite (local file)
- **ORM**: Prisma

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migration
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint | Description | Success | Error |
|--------|----------|-------------|---------|-------|
| GET | `/books` | List all books (paginated) | 200 | - |
| GET | `/books/:id` | Get book by ID | 200 | 404 |
| POST | `/books` | Create new book | 201 | 400, 409 |
| PUT | `/books/:id` | Update book | 200 | 400, 404, 409 |
| DELETE | `/books/:id` | Delete book | 204 | 404 |

### Query Parameters (GET /books)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 100) |
| `sortBy` | string | createdAt | Sort field: title, author, price, createdAt |
| `order` | string | desc | Sort order: asc, desc |

### Book Schema

```json
{
  "id": 1,
  "title": "The Pragmatic Programmer",
  "author": "David Thomas, Andrew Hunt",
  "isbn": "9780135957059",
  "publicationDate": "2019-09-13T00:00:00.000Z",
  "price": 49.99,
  "inventoryQuantity": 25,
  "createdAt": "2024-01-15T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z"
}
```

## TSpec Test Cases

The `test/` directory contains comprehensive TSpec test cases demonstrating various testing scenarios:

### Positive Test Cases

| Test File | Description | Assertions |
|-----------|-------------|------------|
| `list_books.http.tcase` | List books with default pagination | Status 200, pagination metadata |
| `list_books_paginated.http.tcase` | Custom pagination and sorting | Status 200, limit validation |
| `get_book.http.tcase` | Retrieve single book | Status 200, all fields exist |
| `create_book.http.tcase` | Create book with valid data | Status 201, Location header |
| `update_book.http.tcase` | Partial update | Status 200, updated values |
| `delete_book.http.tcase` | Delete existing book | Status 204 |

### Negative Test Cases

| Test File | Description | Expected Status |
|-----------|-------------|-----------------|
| `get_book_not_found.http.tcase` | Get non-existent book | 404 |
| `create_book_validation_error.http.tcase` | Missing required fields | 400 |
| `create_book_invalid_isbn.http.tcase` | Invalid ISBN format | 400 |
| `update_book_not_found.http.tcase` | Update non-existent book | 404 |
| `update_book_validation_error.http.tcase` | Invalid update data | 400 |
| `delete_book_not_found.http.tcase` | Delete non-existent book | 404 |

### Running Tests with TSpec CLI

```bash
# Validate all test cases
tspec validate test/*.http.tcase

# Run all tests against the local server
tspec run test/*.http.tcase

# Run specific test
tspec run test/create_book.http.tcase
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset and reseed database |
| `npm run db:studio` | Open Prisma Studio |

## License

MIT
