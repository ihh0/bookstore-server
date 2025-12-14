import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { HttpCode, AppError } from '../utils/AppError';
import { GetReviewsQuery, GetCommentsQuery } from '../validations/review.validation';

/**
 * 리뷰 및 댓글 관련 HTTP 요청 핸들러
 */
export class ReviewController {
    // ------------------------- Review -------------------------

    /**
     * 리뷰 등록
     * POST /reviews
     */
    static async createReview(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const review = await ReviewService.createReview(req.user.userId, req.body);
        return successResponse(res, review, HttpCode.CREATED);
    }

    /**
     * 리뷰 목록 조회
     * GET /reviews?bookId=1&page=1
     */
    static async getReviews(req: Request, res: Response) {
        const query = req.query as unknown as GetReviewsQuery;
        const { reviews, total } = await ReviewService.getReviews(query);
        return paginatedResponse(res, reviews, query.page, query.size, total);
    }

    /**
     * 리뷰 삭제
     * DELETE /reviews/:id
     */
    static async deleteReview(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const reviewId = Number(req.params.id);
        await ReviewService.deleteReview(req.user.userId, req.user.role, reviewId);
        return successResponse(res, { message: 'Review deleted successfully' });
    }

    /**
     * 리뷰 좋아요 토글
     * POST /reviews/:id/likes
     */
    static async toggleReviewLike(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const reviewId = Number(req.params.id);
        const result = await ReviewService.toggleReviewLike(req.user.userId, reviewId);
        return successResponse(res, result);
    }

    // ------------------------- Comment -------------------------

    /**
     * 댓글 등록
     * POST /reviews/:id/comments
     */
    static async createComment(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const reviewId = Number(req.params.id);
        const comment = await ReviewService.createComment(req.user.userId, reviewId, req.body);
        return successResponse(res, comment, HttpCode.CREATED);
    }

    /**
     * 댓글 목록 조회
     * GET /reviews/:id/comments
     */
    static async getComments(req: Request, res: Response) {
        const reviewId = Number(req.params.id);
        // validate 미들웨어를 거쳐 타입이 안전하다고 가정 (또는 형변환)
        const query = req.query as unknown as GetCommentsQuery;

        const { comments, total } = await ReviewService.getComments(reviewId, query.page, query.size);
        return paginatedResponse(res, comments, query.page, query.size, total);
    }

    /**
     * 댓글 삭제
     * DELETE /reviews/comments/:id
     */
    static async deleteComment(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const commentId = Number(req.params.id);
        await ReviewService.deleteComment(req.user.userId, req.user.role, commentId);
        return successResponse(res, { message: 'Comment deleted successfully' });
    }

    /**
     * 댓글 좋아요 토글
     * POST /reviews/comments/:id/likes
     */
    static async toggleCommentLike(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');
        const commentId = Number(req.params.id);
        const result = await ReviewService.toggleCommentLike(req.user.userId, commentId);
        return successResponse(res, result);
    }
}