import { z } from 'zod';

/**
 * 위시리스트 추가 요청 검증 스키마
 */
export const addWishlistSchema = z.object({
    body: z.object({
        bookId: z.number().int().positive('유효하지 않은 도서 ID입니다.'),
    }),
});

/**
 * 위시리스트 삭제 요청 검증 스키마
 * - URL 파라미터로 bookId를 받습니다.
 */
export const removeWishlistSchema = z.object({
    params: z.object({
        bookId: z.coerce.number().int().positive(),
    }),
});

export type AddWishlistInput = z.infer<typeof addWishlistSchema>['body'];