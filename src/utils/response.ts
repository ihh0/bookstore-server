import { Response } from 'express';
import { HttpCode } from './AppError';

/**
 * 성공 응답 표준 포맷 함수
 * @param res Express Response 객체
 * @param data 응답 데이터
 * @param statusCode HTTP 상태 코드 (기본값 200)
 */
export const successResponse = (
    res: Response,
    data: any,
    statusCode: HttpCode = HttpCode.OK
) => {
    return res.status(statusCode).json(data);
};

/**
 * 페이지네이션 응답 표준 포맷 함수
 * @param res Express Response 객체
 * @param content 리스트 데이터
 * @param page 현재 페이지 번호
 * @param size 페이지 당 항목 수
 * @param totalElements 전체 항목 수
 */
export const paginatedResponse = (
    res: Response,
    content: any[],
    page: number,
    size: number,
    totalElements: number
) => {
    const totalPages = Math.ceil(totalElements / size);

    return res.status(HttpCode.OK).json({
        content,
        page,
        size,
        totalElements,
        totalPages,
    });
};