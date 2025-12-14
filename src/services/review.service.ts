import { prisma } from '../config/db';
import { AppError, HttpCode } from '../utils/AppError';
import { CreateReviewInput, GetReviewsQuery, CreateCommentInput } from '../validations/review.validation';

/**
 * 리뷰 및 댓글 비즈니스 로직 서비스
 */
export class ReviewService {
    // --------------------------------------------------------------------------
    // Review Logic
    // --------------------------------------------------------------------------

    /**
     * 리뷰 등록
     */
    static async createReview(userId: number, data: CreateReviewInput) {
        const { bookId, rating, content } = data;

        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book || book.deletedAt) {
            throw new AppError(HttpCode.NOT_FOUND, 'Book not found', 'REVIEW_BOOK_NOT_FOUND');
        }

        return prisma.review.create({
            data: { userId, bookId, rating, content },
        });
    }

    /**
     * 리뷰 목록 조회
     */
    static async getReviews(query: GetReviewsQuery) {
        const { bookId, page, size } = query;
        const skip = (page - 1) * size;

        const where = { bookId, deletedAt: null };

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                skip,
                take: size,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                    _count: {
                        select: { comments: true, likes: true }
                    },
                },
            }),
            prisma.review.count({ where }),
        ]);

        return { reviews, total };
    }

    /**
     * 리뷰 삭제
     */
    static async deleteReview(userId: number, role: string, reviewId: number) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) throw new AppError(HttpCode.NOT_FOUND, 'Review not found', 'REVIEW_NOT_FOUND');

        if (role !== 'admin' && review.userId !== userId) {
            throw new AppError(HttpCode.FORBIDDEN, 'Access denied', 'REVIEW_ACCESS_DENIED');
        }

        await prisma.review.update({
            where: { id: reviewId },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * 리뷰 좋아요 토글
     */
    static async toggleReviewLike(userId: number, reviewId: number) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.deletedAt) throw new AppError(HttpCode.NOT_FOUND, 'Review not found', 'REVIEW_NOT_FOUND');

        const existingLike = await prisma.reviewLike.findUnique({
            where: { userId_reviewId: { userId, reviewId } },
        });

        if (existingLike) {
            await prisma.reviewLike.delete({ where: { id: existingLike.id } });
            return { message: 'Review like removed', liked: false };
        } else {
            await prisma.reviewLike.create({ data: { userId, reviewId } });
            return { message: 'Review like added', liked: true };
        }
    }

    // --------------------------------------------------------------------------
    // Comment Logic
    // --------------------------------------------------------------------------

    /**
     * 댓글 등록
     */
    static async createComment(userId: number, reviewId: number, data: CreateCommentInput) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.deletedAt) throw new AppError(HttpCode.NOT_FOUND, 'Review not found', 'COMMENT_REVIEW_NOT_FOUND');

        return prisma.reviewComment.create({
            data: { userId, reviewId, content: data.content },
        });
    }

    /**
     * 댓글 목록 조회 (New)
     */
    static async getComments(reviewId: number, page: number, size: number) {
        const skip = (page - 1) * size;

        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.deletedAt) throw new AppError(HttpCode.NOT_FOUND, 'Review not found', 'REVIEW_NOT_FOUND');

        const [comments, total] = await Promise.all([
            prisma.reviewComment.findMany({
                where: { reviewId, deletedAt: null },
                skip,
                take: size,
                orderBy: { createdAt: 'asc' }, // 댓글은 작성 순(오래된 순) 정렬이 일반적
                include: {
                    user: { select: { name: true } },
                    _count: { select: { likes: true } }
                }
            }),
            prisma.reviewComment.count({ where: { reviewId, deletedAt: null } })
        ]);

        return { comments, total };
    }

    /**
     * 댓글 삭제
     */
    static async deleteComment(userId: number, role: string, commentId: number) {
        const comment = await prisma.reviewComment.findUnique({ where: { id: commentId } });
        if (!comment) throw new AppError(HttpCode.NOT_FOUND, 'Comment not found', 'COMMENT_NOT_FOUND');

        if (role !== 'admin' && comment.userId !== userId) {
            throw new AppError(HttpCode.FORBIDDEN, 'Access denied', 'COMMENT_ACCESS_DENIED');
        }

        await prisma.reviewComment.update({
            where: { id: commentId },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * 댓글 좋아요 토글 (New)
     */
    static async toggleCommentLike(userId: number, commentId: number) {
        const comment = await prisma.reviewComment.findUnique({ where: { id: commentId } });
        if (!comment || comment.deletedAt) throw new AppError(HttpCode.NOT_FOUND, 'Comment not found', 'COMMENT_NOT_FOUND');

        const existingLike = await prisma.reviewCommentLike.findUnique({
            where: { userId_commentId: { userId, commentId } },
        });

        if (existingLike) {
            await prisma.reviewCommentLike.delete({ where: { id: existingLike.id } });
            return { message: 'Comment like removed', liked: false };
        } else {
            await prisma.reviewCommentLike.create({ data: { userId, commentId } });
            return { message: 'Comment like added', liked: true };
        }
    }
}