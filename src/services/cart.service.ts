import { prisma } from '../config/db';
import { AppError, HttpCode } from '../utils/AppError';
import { AddToCartInput } from '../validations/cart.validation';

/**
 * 장바구니 비즈니스 로직을 담당하는 서비스 클래스
 */
export class CartService {
    /**
     * 장바구니 담기
     * - 도서 존재 여부 및 재고 확인
     * - 이미 담긴 도서라면 수량 증가 (Update)
     * - 없는 도서라면 새로 생성 (Create)
     */
    static async addToCart(userId: number, data: AddToCartInput) {
        const { bookId, quantity } = data;

        // 1. 도서 존재 여부 및 재고 확인
        const book = await prisma.book.findUnique({
            where: { id: bookId },
        });

        if (!book || book.deletedAt) {
            throw new AppError(HttpCode.NOT_FOUND, 'Book not found', 'CART_BOOK_NOT_FOUND');
        }

        if (book.stockQuantity < quantity) {
            throw new AppError(HttpCode.CONFLICT, 'Insufficient stock', 'CART_OUT_OF_STOCK');
        }

        // 2. 이미 장바구니에 있는지 확인
        const existingItem = await prisma.cart.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId,
                },
            },
        });

        if (existingItem) {
            // 3-1. 이미 있으면 수량 합산 업데이트
            return prisma.cart.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            // 3-2. 없으면 새로 생성
            return prisma.cart.create({
                data: {
                    userId,
                    bookId,
                    quantity,
                },
            });
        }
    }

    /**
     * 장바구니 목록 조회
     * - 최신순 정렬
     * - 도서 정보(제목, 가격, 저자, 표지 등) 포함
     */
    static async getCartItems(userId: number) {
        return prisma.cart.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        discountPrice: true,
                        coverUrl: true,
                        author: true,
                    },
                },
            },
        });
    }

    /**
     * 장바구니 아이템 삭제
     * - 본인의 장바구니 아이템인지 권한 확인 후 삭제
     */
    static async removeFromCart(userId: number, cartId: number) {
        // 삭제 대상 조회
        const cartItem = await prisma.cart.findUnique({
            where: { id: cartId },
        });

        if (!cartItem) {
            throw new AppError(HttpCode.NOT_FOUND, 'Cart item not found', 'CART_ITEM_NOT_FOUND');
        }

        // 소유권 확인
        if (cartItem.userId !== userId) {
            throw new AppError(HttpCode.FORBIDDEN, 'Access denied', 'CART_ACCESS_DENIED');
        }

        return prisma.cart.delete({
            where: { id: cartId },
        });
    }

    /**
     * 장바구니 수량 변경
     * - 수량 수정 (덮어쓰기)
     */
    static async updateQuantity(userId: number, cartId: number, quantity: number) {
        const cartItem = await prisma.cart.findUnique({
            where: { id: cartId },
        });

        if (!cartItem) {
            throw new AppError(HttpCode.NOT_FOUND, 'Cart item not found', 'CART_ITEM_NOT_FOUND');
        }

        if (cartItem.userId !== userId) {
            throw new AppError(HttpCode.FORBIDDEN, 'Access denied', 'CART_ACCESS_DENIED');
        }

        return prisma.cart.update({
            where: { id: cartId },
            data: { quantity },
        });
    }
}