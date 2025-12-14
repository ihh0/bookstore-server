import { Request, Response, NextFunction } from 'express';
import { AppError, HttpCode } from '../utils/AppError';
import { logger } from '../config/logger';

/**
 * 전역 에러 핸들링 미들웨어
 * - 애플리케이션 전역에서 발생하는 모든 에러를 포착하여 처리합니다.
 * - 클라이언트에게 통일된 JSON 형식의 에러 응답을 반환합니다.
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err;

    // 1. AppError가 아닌 예기치 못한 에러(시스템 에러 등) 처리
    if (!(error instanceof AppError)) {
        logger.error(`Unhandled Error: ${err.message}\n${err.stack}`);
        error = new AppError(
            HttpCode.INTERNAL_SERVER_ERROR,
            'Internal Server Error',
            'UNEXPECTED_ERROR'
        );
    } else {
        // 2. 의도된 에러(AppError) 로깅
        // 500번대 에러는 Error 레벨로, 나머지는 Warn 레벨로 로깅
        if (error.statusCode >= 500) {
            logger.error(`Server Error: ${error.message}\n${error.stack}`);
        } else {
            logger.warn(`Client Error: [${error.code}] ${error.message}`);
        }
    }

    const appError = error as AppError;

    // 3. 통일된 에러 응답 반환
    res.status(appError.statusCode).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: appError.statusCode,
        code: appError.code,
        message: appError.message,
        details: appError.details || null,
    });
};