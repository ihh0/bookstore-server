import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError, HttpCode } from '../utils/AppError';

/**
 * 요청 데이터 검증 미들웨어 (Zod)
 * - req.body, req.query, req.params를 스키마와 대조하여 검증합니다.
 * - 검증 및 변환(Transform)된 데이터를 다시 req 객체에 할당합니다.
 * @param schema Zod 스키마 객체
 */
export const validate = (schema: AnyZodObject) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. 요청 데이터 검증 및 변환 실행
        const result = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers,
        });

        // 2. 변환된 데이터(예: 날짜 문자열 -> Date 객체)를 req 객체에 덮어쓰기
        req.body = result.body;
        req.query = result.query;
        req.params = result.params;

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            // 3. 검증 실패 시 에러 메시지를 포맷팅하여 422 에러 반환
            const details = error.errors.reduce((acc, curr) => {
                const key = curr.path.join('.');
                acc[key] = curr.message;
                return acc;
            }, {} as Record<string, string>);

            next(new AppError(
                HttpCode.VALIDATION_ERROR,
                'Validation Error',
                'VALIDATION_FAILED',
                details
            ));
        } else {
            next(error);
        }
    }
};