import { z } from 'zod';

/**
 * 회원 정보 수정 요청 검증 스키마
 * - 비밀번호 변경은 별도 API로 분리하는 것이 보안상 좋음 (여기서는 프로필 정보만 수정)
 */
export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        phoneNumber: z.string().min(10).max(20).optional(),
        address: z.string().optional(),
    }),
});

/**
 * 비밀번호 변경 요청 검증 스키마
 */
export const updatePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
        newPassword: z.string().min(8).max(100, '새 비밀번호는 8자 이상이어야 합니다.'),
    }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>['body'];