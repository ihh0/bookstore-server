import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse } from '../utils/response';
import { HttpCode, AppError } from '../utils/AppError';

/**
 * 인증 관련 HTTP 요청을 처리하는 컨트롤러
 */
export class AuthController {
    /**
     * 회원가입
     * POST /auth/register
     */
    static async register(req: Request, res: Response) {
        const user = await AuthService.register(req.body);
        return successResponse(res, user, HttpCode.CREATED);
    }

    /**
     * 로그인
     * POST /auth/login
     */
    static async login(req: Request, res: Response) {
        const { user, tokens } = await AuthService.login(req.body);

        // 클라이언트에게 전달할 사용자 정보 구성
        const responseData = {
            user: {
                uid: user.uid,
                id: user.loginId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };

        return successResponse(res, responseData, HttpCode.OK);
    }

    /**
     * 로그아웃
     * POST /auth/logout
     */
    static async logout(req: Request, res: Response) {
        // authenticate 미들웨어를 통과했으므로 req.user가 반드시 존재
        if (!req.user) {
            throw new AppError(HttpCode.UNAUTHORIZED, 'User context missing', 'AUTH_REQUIRED');
        }

        await AuthService.logout(req.user.userId);

        return successResponse(res, { message: 'Logged out successfully' }, HttpCode.OK);
    }

    /**
     * 토큰 재발급
     * POST /auth/refresh
     */
    static async refresh(req: Request, res: Response) {
        const authHeader = req.headers.authorization;

        // Bearer 포맷 및 값 추출
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(HttpCode.UNAUTHORIZED, 'Invalid token format. Use Bearer <token>', 'AUTH_INVALID_TOKEN_FORMAT');
        }

        const refreshToken = authHeader.split(' ')[1];

        // 서비스 로직 호출 (서비스는 변경 없이 { refreshToken } 객체를 받음)
        const tokens = await AuthService.refreshTokens({ refreshToken });
        return successResponse(res, tokens, HttpCode.OK);
    }
}