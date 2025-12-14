// src/services/user.service.ts
import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { AppError, HttpCode } from '../utils/AppError';
import { UpdateUserInput, UpdatePasswordInput } from '../validations/user.validation';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * 사용자 정보 관리를 담당하는 서비스 클래스
 */
export class UserService {
    /**
     * 내 정보 조회
     */
    static async getProfile(userId: number) {
        const user = await prisma.user.findUnique({
            where: { uid: userId },
        });

        if (!user || user.deletedAt) {
            throw new AppError(HttpCode.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
        }

        // 비밀번호 제외하고 반환
        const { passwordHash, ...userInfo } = user;
        return userInfo;
    }

    /**
     * 내 정보 수정 (이름, 전화번호, 주소)
     */
    static async updateProfile(userId: number, data: UpdateUserInput) {
        // 전화번호 중복 체크 (전화번호가 변경된 경우)
        if (data.phoneNumber) {
            const exists = await prisma.user.findFirst({
                where: {
                    phoneNumber: data.phoneNumber,
                    NOT: { uid: userId }, // 본인 제외
                },
            });
            if (exists) {
                throw new AppError(HttpCode.CONFLICT, 'Phone number already in use', 'USER_PHONE_DUPLICATE');
            }
        }

        const updatedUser = await prisma.user.update({
            where: { uid: userId },
            data: data,
        });

        const { passwordHash, ...userInfo } = updatedUser;
        return userInfo;
    }

    /**
     * 비밀번호 변경
     */
    static async updatePassword(userId: number, data: UpdatePasswordInput) {
        const user = await prisma.user.findUnique({ where: { uid: userId } });
        if (!user) throw new AppError(HttpCode.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');

        // 1. 현재 비밀번호 확인
        const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new AppError(HttpCode.UNAUTHORIZED, 'Incorrect current password', 'USER_PASSWORD_MISMATCH');
        }

        // 2. 새 비밀번호 해싱 및 업데이트
        const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

        await prisma.user.update({
            where: { uid: userId },
            data: { passwordHash: newPasswordHash },
        });
    }

    /**
     * 회원 탈퇴 (Soft Delete)
     */
    static async deleteAccount(userId: number) {
        await prisma.user.update({
            where: { uid: userId },
            data: { deletedAt: new Date() },
        });
    }
}