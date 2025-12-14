import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createReviewSchema, getReviewsSchema, createCommentSchema, getCommentsSchema } from '../validations/review.validation';

const router = Router();

// --------------------------------------------------------------------------
// Public Routes
// --------------------------------------------------------------------------
// 1. 리뷰 목록 조회 (쿼리 파라미터 bookId 필수)
router.get(
    '/',
    validate(getReviewsSchema),
    ReviewController.getReviews
);

// 2. 리뷰 댓글 목록 조회
router.get(
    '/:id/comments',
    validate(getCommentsSchema),
    ReviewController.getComments
);

// --------------------------------------------------------------------------
// Protected Routes
// --------------------------------------------------------------------------
// 아래 기능들은 로그인 필요
router.use(authenticate);

// 3. 리뷰 등록
router.post(
    '/',
    validate(createReviewSchema),
    ReviewController.createReview
);

// 4. 리뷰 삭제
router.delete('/:id', ReviewController.deleteReview);

// 5. 리뷰 좋아요 토글
router.post('/:id/likes', ReviewController.toggleReviewLike);

// 6. 댓글 등록
router.post(
    '/:id/comments',
    validate(createCommentSchema),
    ReviewController.createComment
);

// 7. 댓글 삭제
// (주의: 리뷰 ID가 아닌 댓글 ID로 직접 삭제)
router.delete('/comments/:id', ReviewController.deleteComment);

// 8. 댓글 좋아요 토글
router.post('/comments/:id/likes', ReviewController.toggleCommentLike);

export default router;