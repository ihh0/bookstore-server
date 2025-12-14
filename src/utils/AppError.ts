import { Response } from 'express';

// HTTP 상태 코드 정의
export enum HttpCode {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    VALIDATION_ERROR = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
}

export type ErrorDetails = Record<string, any>;

/**
 * 애플리케이션 전용 커스텀 에러 클래스
 * - statusCode, error code, details를 포함하여 일관된 에러 처리를 돕습니다.
 */
export class AppError extends Error {
    public readonly statusCode: HttpCode;
    public readonly code: string;
    public readonly details?: ErrorDetails;
    public readonly isOperational: boolean;

    constructor(
        statusCode: HttpCode,
        message: string,
        code: string = 'INTERNAL_ERROR',
        details?: ErrorDetails
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true; // 프로그래밍 버그가 아닌 예측 가능한 에러임을 표시

        Error.captureStackTrace(this, this.constructor);
    }
}