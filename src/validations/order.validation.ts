import { z } from 'zod';

/**
 * 개별 주문 아이템 검증 스키마
 */
const orderItemSchema = z.object({
    bookId: z.number().int().positive(),
    quantity: z.number().int().min(1),
});

/**
 * 주문 생성 요청 검증 스키마
 */
export const createOrderSchema = z.object({
    body: z.object({
        items: z.array(orderItemSchema).min(1, '주문할 상품이 최소 1개 이상이어야 합니다.'),
        deliveryAddress: z.string().min(5, '배송지 주소는 상세히 입력해주세요.'),
        paymentMethod: z.string().optional(), // 예: 'card', 'bank_transfer'
    }),
});

/**
 * 주문 상태 변경 요청 검증 스키마 (관리자용)
 */
export const updateOrderStatusSchema = z.object({
    params: z.object({
        id: z.string(), // URL parameter
    }),
    body: z.object({
        status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'canceled']),
    }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type OrderItemInput = z.infer<typeof createOrderSchema>['body']['items'][number];