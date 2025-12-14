import { z } from 'zod';

/**
 * 회원가입 요청 검증 스키마
 * - id: 로그인 ID (4~50자)
 * - password: 최소 8자 이상
 * - phoneNumber: 10~20자
 */
export const registerSchema = z.object({
    body: z.object({
        id: z.string().min(4).max(50),
        email: z.string().email(),
        password: z.string().min(8).max(100),
        name: z.string().min(2).max(50).optional(),
        phoneNumber: z.string().min(10).max(20),
        address: z.string().optional(),
    }),
});

/**
 * 로그인 요청 검증 스키마
 */
export const loginSchema = z.object({
    body: z.object({
        id: z.string(), // 로그인 ID
        password: z.string(),
    }),
});


/**
 * 토큰 재발급 검증 스키마
 */
export const refreshSchema = z.object({
    headers: z.object({
        // Express에서 헤더 키는 자동으로 소문자로 변환됩니다.
        authorization: z.string().min(1, 'Authorization header is required'),
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];