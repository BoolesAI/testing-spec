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
export declare function validateBookCreate(data: BookInput): ValidationError[];
export declare function validateBookUpdate(data: BookInput): ValidationError[];
