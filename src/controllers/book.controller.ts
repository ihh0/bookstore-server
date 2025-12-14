// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import { BookService } from '../services/book.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { HttpCode } from '../utils/AppError';
import { BookQueryInput } from '../validations/book.validation';

/**
 * 도서 관련 HTTP 요청을 처리하는 컨트롤러
 */
export class BookController {
    /**
     * 도서 등록
     * POST /books
     */
    static async create(req: Request, res: Response) {
        const book = await BookService.createBook(req.body);
        return successResponse(res, book, HttpCode.CREATED);
    }

    /**
     * 도서 목록 조회
     * GET /books?page=1&size=20&sort=createdAt,DESC
     */
    static async findAll(req: Request, res: Response) {
        const query = req.query as unknown as BookQueryInput;
        const { books, total } = await BookService.getBooks(query);

        return paginatedResponse(res, books, query.page, query.size, total);
    }

    /**
     * 도서 상세 조회
     * GET /books/:id
     */
    static async findOne(req: Request, res: Response) {
        const id = Number(req.params.id);
        const book = await BookService.getBookById(id);
        return successResponse(res, book);
    }

    /**
     * 도서 정보 수정
     * PUT /books/:id
     */
    static async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const book = await BookService.updateBook(id, req.body);
        return successResponse(res, book);
    }

    /**
     * 도서 삭제
     * DELETE /books/:id
     */
    static async delete(req: Request, res: Response) {
        const id = Number(req.params.id);
        await BookService.deleteBook(id);
        return successResponse(res, { message: 'Book deleted successfully' });
    }
}