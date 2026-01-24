import type { Context } from 'koa';
import * as bookService from '../services/bookService.js';
import { validateBookCreate, validateBookUpdate, type BookInput } from '../utils/validator.js';

export async function listBooks(ctx: Context): Promise<void> {
  const page = Math.max(1, parseInt(ctx.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(ctx.query.limit as string) || 10));
  const sortBy = (['title', 'author', 'price', 'createdAt'].includes(ctx.query.sortBy as string) 
    ? ctx.query.sortBy 
    : 'createdAt') as 'title' | 'author' | 'price' | 'createdAt';
  const order = (ctx.query.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const result = await bookService.findAll({ page, limit, sortBy, order });
  ctx.body = result;
}

export async function getBook(ctx: Context): Promise<void> {
  const id = parseInt(ctx.params.id);
  if (isNaN(id)) {
    ctx.status = 400;
    ctx.body = {
      error: 'Bad Request',
      message: 'Invalid book ID',
      timestamp: new Date().toISOString()
    };
    return;
  }

  const book = await bookService.findById(id);
  if (!book) {
    ctx.status = 404;
    ctx.body = {
      error: 'Not Found',
      message: 'Book not found',
      timestamp: new Date().toISOString()
    };
    return;
  }

  ctx.body = book;
}

export async function createBook(ctx: Context): Promise<void> {
  const data = ctx.request.body as BookInput;
  const errors = validateBookCreate(data);

  if (errors.length > 0) {
    ctx.status = 400;
    ctx.body = {
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors,
      timestamp: new Date().toISOString()
    };
    return;
  }

  const book = await bookService.create({
    title: data.title!,
    author: data.author!,
    isbn: data.isbn!,
    publicationDate: new Date(data.publicationDate!),
    price: data.price!,
    inventoryQuantity: data.inventoryQuantity
  });

  ctx.status = 201;
  ctx.set('Location', `/api/v1/books/${book.id}`);
  ctx.body = book;
}

export async function updateBook(ctx: Context): Promise<void> {
  const id = parseInt(ctx.params.id);
  if (isNaN(id)) {
    ctx.status = 400;
    ctx.body = {
      error: 'Bad Request',
      message: 'Invalid book ID',
      timestamp: new Date().toISOString()
    };
    return;
  }

  const data = ctx.request.body as BookInput;
  const errors = validateBookUpdate(data);

  if (errors.length > 0) {
    ctx.status = 400;
    ctx.body = {
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors,
      timestamp: new Date().toISOString()
    };
    return;
  }

  const existing = await bookService.findById(id);
  if (!existing) {
    ctx.status = 404;
    ctx.body = {
      error: 'Not Found',
      message: 'Book not found',
      timestamp: new Date().toISOString()
    };
    return;
  }

  const book = await bookService.update(id, {
    title: data.title,
    author: data.author,
    isbn: data.isbn,
    publicationDate: data.publicationDate ? new Date(data.publicationDate) : undefined,
    price: data.price,
    inventoryQuantity: data.inventoryQuantity
  });

  ctx.body = book;
}

export async function deleteBook(ctx: Context): Promise<void> {
  const id = parseInt(ctx.params.id);
  if (isNaN(id)) {
    ctx.status = 400;
    ctx.body = {
      error: 'Bad Request',
      message: 'Invalid book ID',
      timestamp: new Date().toISOString()
    };
    return;
  }

  const existing = await bookService.findById(id);
  if (!existing) {
    ctx.status = 404;
    ctx.body = {
      error: 'Not Found',
      message: 'Book not found',
      timestamp: new Date().toISOString()
    };
    return;
  }

  await bookService.remove(id);
  ctx.status = 204;
}
