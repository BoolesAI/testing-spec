export interface ValidationError {
  field: string;
  message: string;
}

export interface BookInput {
  title?: string;
  author?: string;
  isbn?: string;
  publicationDate?: string;
  price?: number;
  inventoryQuantity?: number;
}

export function validateBookCreate(data: BookInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string' });
  }

  if (!data.author || typeof data.author !== 'string' || data.author.trim() === '') {
    errors.push({ field: 'author', message: 'Author is required and must be a non-empty string' });
  }

  if (!data.isbn || typeof data.isbn !== 'string') {
    errors.push({ field: 'isbn', message: 'ISBN is required and must be a string' });
  } else if (!isValidISBN(data.isbn)) {
    errors.push({ field: 'isbn', message: 'ISBN must be a valid ISBN-10 or ISBN-13 format' });
  }

  if (!data.publicationDate || typeof data.publicationDate !== 'string') {
    errors.push({ field: 'publicationDate', message: 'Publication date is required' });
  } else if (isNaN(Date.parse(data.publicationDate))) {
    errors.push({ field: 'publicationDate', message: 'Publication date must be a valid date' });
  }

  if (data.price === undefined || data.price === null) {
    errors.push({ field: 'price', message: 'Price is required' });
  } else if (typeof data.price !== 'number' || data.price < 0) {
    errors.push({ field: 'price', message: 'Price must be a non-negative number' });
  }

  if (data.inventoryQuantity !== undefined && data.inventoryQuantity !== null) {
    if (typeof data.inventoryQuantity !== 'number' || data.inventoryQuantity < 0 || !Number.isInteger(data.inventoryQuantity)) {
      errors.push({ field: 'inventoryQuantity', message: 'Inventory quantity must be a non-negative integer' });
    }
  }

  return errors;
}

export function validateBookUpdate(data: BookInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim() === '')) {
    errors.push({ field: 'title', message: 'Title must be a non-empty string' });
  }

  if (data.author !== undefined && (typeof data.author !== 'string' || data.author.trim() === '')) {
    errors.push({ field: 'author', message: 'Author must be a non-empty string' });
  }

  if (data.isbn !== undefined) {
    if (typeof data.isbn !== 'string') {
      errors.push({ field: 'isbn', message: 'ISBN must be a string' });
    } else if (!isValidISBN(data.isbn)) {
      errors.push({ field: 'isbn', message: 'ISBN must be a valid ISBN-10 or ISBN-13 format' });
    }
  }

  if (data.publicationDate !== undefined) {
    if (typeof data.publicationDate !== 'string' || isNaN(Date.parse(data.publicationDate))) {
      errors.push({ field: 'publicationDate', message: 'Publication date must be a valid date' });
    }
  }

  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push({ field: 'price', message: 'Price must be a non-negative number' });
  }

  if (data.inventoryQuantity !== undefined) {
    if (typeof data.inventoryQuantity !== 'number' || data.inventoryQuantity < 0 || !Number.isInteger(data.inventoryQuantity)) {
      errors.push({ field: 'inventoryQuantity', message: 'Inventory quantity must be a non-negative integer' });
    }
  }

  return errors;
}

function isValidISBN(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}
