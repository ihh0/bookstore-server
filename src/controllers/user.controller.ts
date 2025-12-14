import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { successResponse } from '../utils/response';
import { HttpCode, AppError } from '../utils/AppError';

/**
 * 사용자 관련 HTTP 요청을 처리하는 컨트롤러
 */
export class UserController {
    /**
     * 내 정보 조회
     * GET /users/me
     */
    static async getMe(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const user = await UserService.getProfile(req.user.userId);
        return successResponse(res, user);
    }

    /**
     * 내 정보 수정
     * PUT /users/me
     */
    static async updateMe(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const user = await UserService.updateProfile(req.user.userId, req.body);
        return successResponse(res, user);
    }

    /**
     * 비밀번호 변경
     * PUT /users/password
     */
    static async updatePassword(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        await UserService.updatePassword(req.user.userId, req.body);
        return successResponse(res, { message: 'Password updated successfully' });
    }

    /**
     * 회원 탈퇴
     * DELETE /users/me
     */
    static async deleteMe(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        await UserService.deleteAccount(req.user.userId);
        return successResponse(res, { message: 'Account deleted successfully' });
    }
}