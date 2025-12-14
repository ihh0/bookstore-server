// src/validations/book.validation.ts
import { z } from 'zod';

/**
 * 도서 등록 요청 검증 스키마
 * - publishedDate: 문자열 입력 시 자동으로 Date 객체로 변환
 */
export const createBookSchema = z.object({
    body: z.object({
        title: z.string().min(1, '제목은 필수입니다.').max(200),
        isbn: z.string().optional(),
        coverUrl: z.string().url().optional(),
        author: z.string().min(1, '저자는 필수입니다.'),
        translator: z.string().optional(),
        publisher: z.string().optional(),
        publishedDate: z.coerce.date().optional(), // "2024-01-01" -> Date
        category: z.string().optional(),
        description: z.string().optional(),
        price: z.number().min(0, '가격은 0원 이상이어야 합니다.'),
        stockQuantity: z.number().int().min(0).default(0),
        discountRate: z.number().min(0).max(1).optional(),
    }),
});

/**
 * 도서 수정 요청 검증 스키마
 * - URL Parameter(id)와 Body 모두 검증
 */
export const updateBookSchema = z.object({
    params: z.object({
        id: z.string(), // validate 미들웨어에서 값 보존을 위해 필수
    }),
    body: z.object({
        title: z.string().max(200).optional(),
        isbn: z.string().optional(),
        coverUrl: z.string().url().optional(),
        author: z.string().optional(),
        translator: z.string().optional(),
        publisher: z.string().optional(),
        publishedDate: z.coerce.date().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        stockQuantity: z.number().int().min(0).optional(),
        discountRate: z.number().min(0).max(1).optional(),
    }),
});

/**
 * 도서 목록 조회 쿼리 파라미터 검증 스키마
 * - page, size: 문자열 입력 시 자동으로 숫자로 변환
 */
export const queryBookSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        size: z.coerce.number().int().min(1).default(20),
        keyword: z.string().optional(), // 제목 or 저자 검색
        category: z.string().optional(),
        sort: z.string().optional(), // 예: "price,DESC"
    }),
});

export type CreateBookInput = z.infer<typeof createBookSchema>['body'];
export type UpdateBookInput = z.infer<typeof updateBookSchema>['body'];
export type BookQueryInput = z.infer<typeof queryBookSchema>['query'];