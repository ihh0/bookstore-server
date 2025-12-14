// src/routes/book.routes.ts
import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { validate } from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
    createBookSchema,
    updateBookSchema,
    queryBookSchema
} from '../validations/book.validation';

const router = Router();

// --------------------------------------------------------------------------
// Public Routes (비로그인 사용자 접근 가능)
// --------------------------------------------------------------------------

// 1. 도서 목록 조회 (검색, 필터링, 페이징)
router.get(
    '/',
    validate(queryBookSchema), // 쿼리 파라미터 유효성 검사
    BookController.findAll
);

// 2. 도서 상세 조회
router.get('/:id', BookController.findOne);

// --------------------------------------------------------------------------
// Admin Routes (관리자 전용)
// --------------------------------------------------------------------------

// 3. 도서 등록
router.post(
    '/',
    authenticate, // 로그인 확인
    authorize('admin'), // 관리자 권한 확인
    validate(createBookSchema), // 입력값 검증
    BookController.create
);

// 4. 도서 정보 수정
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(updateBookSchema),
    BookController.update
);

// 5. 도서 삭제 (Soft Delete)
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    BookController.delete
);

export default router;