import jwt, { SignOptions } from 'jsonwebtoken';
import redisClient from '../config/redis';
import { AppError, HttpCode } from './AppError';

const ACCESS_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.JWT_SECRET || 'secret';

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRATION || '7d';

export interface TokenPayload {
    userId: number;
    role: string;
}

/**
 * Access Token과 Refresh Token을 동시 발급
 * @param userId 사용자 식별자
 * @param role 사용자 권한 ('user', 'admin')
 */
export const generateTokens = async (userId: number, role: string) => {
    const payload: TokenPayload = { userId, role };

    // 1. Access Token 생성 (Stateless)
    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
    } as SignOptions);

    // 2. Refresh Token 생성 (Stateful via Redis)
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
    } as SignOptions);

    // 3. Redis에 Refresh Token 저장 (유효기간 7일)
    // 키: user:{userId}:refresh
    await redisClient.set(`user:${userId}:refresh`, refreshToken, {
        EX: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return { accessToken, refreshToken };
};

/**
 * Access Token 검증
 */
export const verifyAccessToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    } catch (error) {
        throw new AppError(HttpCode.UNAUTHORIZED, 'Invalid or expired access token', 'AUTH_INVALID_TOKEN');
    }
};

/**
 * Refresh Token 검증
 * - 서명 검증 후 Redis에 저장된 토큰과 일치하는지 확인 (탈취/로그아웃 대응)
 */
export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
    try {
        // 1. JWT 서명 검증
        const payload = jwt.verify(token, REFRESH_SECRET) as TokenPayload;

        // 2. Redis 저장 값과 비교
        const storedToken = await redisClient.get(`user:${payload.userId}:refresh`);

        if (!storedToken || storedToken !== token) {
            throw new AppError(HttpCode.UNAUTHORIZED, 'Invalid refresh token', 'AUTH_INVALID_REFRESH_TOKEN');
        }

        return payload;
    } catch (error) {
        throw new AppError(HttpCode.UNAUTHORIZED, 'Invalid or expired refresh token', 'AUTH_INVALID_REFRESH_TOKEN');
    }
};

/**
 * Redis에서 Refresh Token 삭제 (로그아웃)
 */
export const removeRefreshToken = async (userId: number) => {
    await redisClient.del(`user:${userId}:refresh`);
};