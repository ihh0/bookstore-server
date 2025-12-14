import { prisma } from '../config/db';
import { AppError, HttpCode } from '../utils/AppError';

/**
 * 위시리스트(찜) 비즈니스 로직 서비스
 */
export class WishlistService {
    /**
     * 위시리스트 추가
     * - 이미 찜한 경우 에러 반환 (또는 무시)
     */
    static async addWishlist(userId: number, bookId: number) {
        // 1. 도서 존재 확인
        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book || book.deletedAt) {
            throw new AppError(HttpCode.NOT_FOUND, 'Book not found', 'WISHLIST_BOOK_NOT_FOUND');
        }

        // 2. 이미 찜했는지 확인
        const exists = await prisma.wishlist.findUnique({
            where: {
                userId_bookId: { userId, bookId },
            },
        });

        if (exists) {
            throw new AppError(HttpCode.CONFLICT, 'Book already in wishlist', 'WISHLIST_ALREADY_EXISTS');
        }

        // 3. 추가
        return prisma.wishlist.create({
            data: { userId, bookId },
        });
    }

    /**
     * 위시리스트 삭제
     */
    static async removeWishlist(userId: number, bookId: number) {
        // 존재 확인
        const exists = await prisma.wishlist.findUnique({
            where: {
                userId_bookId: { userId, bookId },
            },
        });

        if (!exists) {
            throw new AppError(HttpCode.NOT_FOUND, 'Item not found in wishlist', 'WISHLIST_NOT_FOUND');
        }

        return prisma.wishlist.delete({
            where: {
                userId_bookId: { userId, bookId },
            },
        });
    }

    /**
     * 내 위시리스트 목록 조회
     */
    static async getWishlist(userId: number) {
        return prisma.wishlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        price: true,
                        discountPrice: true,
                        coverUrl: true,
                    },
                },
            },
        });
    }
}