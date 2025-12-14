import { prisma } from '../config/db';
import { CreateOrderInput } from '../validations/order.validation';
import { AppError, HttpCode } from '../utils/AppError';
import { Prisma } from '@prisma/client';

/**
 * 주문 관리 비즈니스 로직을 담당하는 서비스
 */
export class OrderService {
    /**
     * 주문 생성 (트랜잭션 보장)
     * 1. 도서 정보 및 재고 확인
     * 2. 총 결제 금액 계산
     * 3. 도서 재고 차감
     * 4. 주문 및 주문 상세 레코드 생성
     */
    static async createOrder(userId: number, data: CreateOrderInput) {
        const { items, deliveryAddress, paymentMethod } = data;

        return prisma.$transaction(async (tx) => {
            // 1. 주문할 도서 정보 조회 (가격, 재고 확인용)
            const bookIds = items.map((item) => item.bookId);
            const books = await tx.book.findMany({
                where: { id: { in: bookIds } },
            });

            // 2. 재고 확인 및 총액 계산
            let totalPrice = 0;
            const orderItemsData = [];

            for (const item of items) {
                const book = books.find((b) => b.id === item.bookId);

                if (!book) {
                    throw new AppError(HttpCode.NOT_FOUND, `Book ID ${item.bookId} not found`, 'ORDER_BOOK_NOT_FOUND');
                }

                if (book.stockQuantity < item.quantity) {
                    throw new AppError(HttpCode.CONFLICT, `Insufficient stock for book: ${book.title}`, 'ORDER_OUT_OF_STOCK');
                }

                // 가격 계산 (할인가 우선 적용)
                const price = Number(book.discountPrice ?? book.price);
                totalPrice += price * item.quantity;

                orderItemsData.push({
                    bookId: book.id,
                    quantity: item.quantity,
                    price: price, // 주문 시점의 가격 저장 (가격 변동 대응)
                    subtotal: price * item.quantity,
                });

                // 3. 도서 재고 차감
                await tx.book.update({
                    where: { id: book.id },
                    data: { stockQuantity: { decrement: item.quantity } },
                });
            }

            // 4. 주문 번호 생성 (YYYYMMDD-Random4)
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const orderNumber = `${date}-${random}`;

            // 5. 주문 레코드 생성
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    orderNumber,
                    totalPrice,
                    shippingAddress: deliveryAddress, // DTO(deliveryAddress) -> DB(shippingAddress) 매핑
                    paymentMethod,
                    status: 'paid', // 결제 모듈 연동 전이므로 즉시 결제 완료 처리
                    orderItems: {
                        create: orderItemsData,
                    },
                },
                include: {
                    orderItems: true,
                },
            });

            return newOrder;
        });
    }

    /**
     * 주문 목록 조회
     * - 일반 사용자: 본인 주문만 조회
     * - 관리자: 전체 주문 조회 가능
     */
    static async getOrders(userId: number, role: string, page = 1, size = 20) {
        const skip = (page - 1) * size;
        const where: Prisma.OrderWhereInput = {};

        // 권한에 따른 조회 범위 설정
        if (role !== 'admin') {
            where.userId = userId;
        }

        // 데이터 조회 및 카운트 (병렬 처리)
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: size,
                orderBy: { createdAt: 'desc' }, // 최신순 정렬
                include: {
                    orderItems: {
                        include: { book: { select: { title: true } } }, // 요약 정보용 책 제목 포함
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        return { orders, total };
    }

    /**
     * 주문 상세 조회
     * - 본인 주문 또는 관리자만 접근 가능
     */
    static async getOrderById(userId: number, role: string, orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: { book: true }, // 상세 정보용 전체 책 정보 포함
                },
                user: { select: { email: true, name: true } }, // 주문자 정보 포함
            },
        });

        if (!order) {
            throw new AppError(HttpCode.NOT_FOUND, 'Order not found', 'ORDER_NOT_FOUND');
        }

        // 접근 권한 확인
        if (role !== 'admin' && order.userId !== userId) {
            throw new AppError(HttpCode.FORBIDDEN, 'Access denied', 'ORDER_ACCESS_DENIED');
        }

        return order;
    }

    /**
     * 주문 취소 (트랜잭션 보장)
     * 1. 주문 상태 확인 (이미 취소/배송 중 여부)
     * 2. 주문 상태 변경 ('canceled')
     * 3. 도서 재고 복구 (Increment)
     */
    static async cancelOrder(userId: number, role: string, orderId: number) {
        return prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { orderItems: true },
            });

            if (!order) {
                throw new AppError(HttpCode.NOT_FOUND, 'Order not found', 'ORDER_NOT_FOUND');
            }

            // 접근 권한 확인
            if (role !== 'admin' && order.userId !== userId) {
                throw new AppError(HttpCode.FORBIDDEN, 'Access denied', 'ORDER_ACCESS_DENIED');
            }

            // 취소 가능 상태 확인
            if (order.status === 'canceled') {
                throw new AppError(HttpCode.CONFLICT, 'Order already canceled', 'ORDER_ALREADY_CANCELED');
            }
            if (['shipped', 'delivered'].includes(order.status)) {
                throw new AppError(HttpCode.CONFLICT, 'Cannot cancel shipped order', 'ORDER_CANNOT_CANCEL');
            }

            // 1. 상태 변경
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: 'canceled' },
            });

            // 2. 재고 복구
            for (const item of order.orderItems) {
                await tx.book.update({
                    where: { id: item.bookId },
                    data: { stockQuantity: { increment: item.quantity } },
                });
            }

            return updatedOrder;
        });
    }

    /**
     * 주문 배송 상태 변경 (관리자 전용)
     */
    static async updateStatus(orderId: number, status: string) {
        return prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }
}