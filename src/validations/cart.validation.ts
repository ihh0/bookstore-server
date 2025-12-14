import { z } from 'zod';

/**
 * 장바구니 담기 요청 검증 스키마
 */
export const addToCartSchema = z.object({
    body: z.object({
        bookId: z.number().int().positive('유효하지 않은 도서 ID입니다.'),
        quantity: z.number().int().min(1, '수량은 1개 이상이어야 합니다.').default(1),
    }),
});

/**
 * 장바구니 수량 변경 요청 검증 스키마
 * - URL 파라미터(id)와 변경할 수량(quantity) 검증
 */
export const updateCartItemSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive(), // cartId
    }),
    body: z.object({
        quantity: z.number().int().min(1, '수량은 1개 이상이어야 합니다.'),
    }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];