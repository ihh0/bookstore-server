import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError, HttpCode } from '../utils/AppError';

/**
 * JWT 인증 미들웨어
 * - 요청 헤더에서 Access Token을 추출하여 검증합니다.
 * - 검증 성공 시, Payload(userId, role)를 req.user에 주입합니다.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Authorization 헤더 존재 및 포맷(Bearer) 확인
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(
                HttpCode.UNAUTHORIZED,
                'Access token is missing or invalid (Format: Bearer <token>)',
                'AUTH_TOKEN_MISSING'
            );
        }

        // 2. 토큰 추출
        const token = authHeader.split(' ')[1];

        // 3. 토큰 검증 (만료 여부, 서명 확인)
        const payload = verifyAccessToken(token);

        // 4. Request 객체에 사용자 정보 주입
        req.user = payload;

        next();
    } catch (error) {
        // 토큰 검증 실패 (만료, 위조 등) 시 에러 전달
        next(error);
    }
};

/**
 * 역할(Role) 기반 인가 미들웨어
 * - authenticate 미들웨어 이후에 실행되어야 합니다.
 * - 사용자의 Role이 허용된 목록에 포함되는지 확인합니다.
 * @param roles 허용할 권한 목록 (예: 'admin', 'user')
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // authenticate를 통과하지 않아 req.user가 없는 경우 방어 로직
        if (!req.user) {
            return next(new AppError(HttpCode.UNAUTHORIZED, 'User not authenticated', 'AUTH_REQUIRED'));
        }

        const userRole = req.user.role.toUpperCase();
        const allowedRoles = roles.map(role => role.toUpperCase());

        // 권한 확인
        if (!allowedRoles.includes(userRole)) {
            return next(
                new AppError(
                    HttpCode.FORBIDDEN,
                    'You do not have permission to perform this action',
                    'AUTH_FORBIDDEN'
                )
            );
        }

        next();
    };
};