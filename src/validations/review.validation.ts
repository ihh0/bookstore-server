import { z } from 'zod';

/**
 * 리뷰 등록 요청 검증 스키마
 */
export const createReviewSchema = z.object({
    body: z.object({
        bookId: z.number().int().positive(),
        rating: z.number().int().min(1, '별점은 1점 이상이어야 합니다.').max(5, '별점은 5점 이하이어야 합니다.'),
        content: z.string().min(5, '리뷰 내용은 최소 5자 이상 작성해주세요.'),
    }),
});

/**
 * 리뷰 목록 조회 쿼리 검증 스키마
 */
export const getReviewsSchema = z.object({
    query: z.object({
        bookId: z.coerce.number().int().positive(),
        page: z.coerce.number().int().min(1).default(1),
        size: z.coerce.number().int().min(1).default(10),
    }),
});

/**
 * 댓글 등록 요청 검증 스키마
 */
export const createCommentSchema = z.object({
    params: z.object({
        id: z.string(), // reviewId (URL Parameter)
    }),
    body: z.object({
        content: z.string().min(2, '댓글은 최소 2자 이상 작성해주세요.'),
    }),
});

/**
 * 댓글 목록 조회 검증 스키마 (New)
 */
export const getCommentsSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive(), // reviewId
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        size: z.coerce.number().int().min(1).default(20),
    }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type GetReviewsQuery = z.infer<typeof getReviewsSchema>['query'];
export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type GetCommentsQuery = z.infer<typeof getCommentsSchema>['query'];