import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface BookCreateInput {
  title: string;
  author: string;
  isbn: string;
  publicationDate: Date;
  price: number;
  inventoryQuantity?: number;
}

export interface BookUpdateInput {
  title?: string;
  author?: string;
  isbn?: string;
  publicationDate?: Date;
  price?: number;
  inventoryQuantity?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: 'title' | 'author' | 'price' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function serializeBook(book: Prisma.BookGetPayload<object>) {
  return {
    ...book,
    price: Number(book.price)
  };
}

export async function findAll(options: PaginationOptions): Promise<PaginatedResult<ReturnType<typeof serializeBook>>> {
  const { page, limit, sortBy = 'createdAt', order = 'desc' } = options;
  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: order }
    }),
    prisma.book.count()
  ]);

  return {
    data: books.map(serializeBook),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function findById(id: number) {
  const book = await prisma.book.findUnique({ where: { id } });
  return book ? serializeBook(book) : null;
}

export async function create(data: BookCreateInput) {
  const book = await prisma.book.create({
    data: {
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      publicationDate: data.publicationDate,
      price: new Prisma.Decimal(data.price),
      inventoryQuantity: data.inventoryQuantity ?? 0
    }
  });
  return serializeBook(book);
}

export async function update(id: number, data: BookUpdateInput) {
  const updateData: Prisma.BookUpdateInput = {};
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.isbn !== undefined) updateData.isbn = data.isbn;
  if (data.publicationDate !== undefined) updateData.publicationDate = data.publicationDate;
  if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
  if (data.inventoryQuantity !== undefined) updateData.inventoryQuantity = data.inventoryQuantity;

  const book = await prisma.book.update({
    where: { id },
    data: updateData
  });
  return serializeBook(book);
}

export async function remove(id: number): Promise<void> {
  await prisma.book.delete({ where: { id } });
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
