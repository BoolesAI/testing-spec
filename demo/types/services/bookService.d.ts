import { Prisma } from '@prisma/client';
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
declare function serializeBook(book: Prisma.BookGetPayload<object>): {
    price: number;
    title: string;
    author: string;
    createdAt: Date;
    id: number;
    isbn: string;
    publicationDate: Date;
    inventoryQuantity: number;
    updatedAt: Date;
};
export declare function findAll(options: PaginationOptions): Promise<PaginatedResult<ReturnType<typeof serializeBook>>>;
export declare function findById(id: number): Promise<{
    price: number;
    title: string;
    author: string;
    createdAt: Date;
    id: number;
    isbn: string;
    publicationDate: Date;
    inventoryQuantity: number;
    updatedAt: Date;
} | null>;
export declare function create(data: BookCreateInput): Promise<{
    price: number;
    title: string;
    author: string;
    createdAt: Date;
    id: number;
    isbn: string;
    publicationDate: Date;
    inventoryQuantity: number;
    updatedAt: Date;
}>;
export declare function update(id: number, data: BookUpdateInput): Promise<{
    price: number;
    title: string;
    author: string;
    createdAt: Date;
    id: number;
    isbn: string;
    publicationDate: Date;
    inventoryQuantity: number;
    updatedAt: Date;
}>;
export declare function remove(id: number): Promise<void>;
export declare function disconnect(): Promise<void>;
export {};
