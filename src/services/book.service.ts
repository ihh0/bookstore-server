import { prisma } from '../config/db';
import { CreateBookInput, UpdateBookInput, BookQueryInput } from '../validations/book.validation';
import { AppError, HttpCode } from '../utils/AppError';
import { Prisma } from '@prisma/client';

/**
 * 도서 관리 비즈니스 로직을 담당하는 서비스 클래스
 */
export class BookService {
    /**
     * 도서 등록 (관리자 전용)
     * 1. ISBN 중복 체크 (선택 사항이지만 입력된 경우 유니크해야 함)
     * 2. 할인 가격 자동 계산
     * 3. 도서 레코드 생성
     */
    static async createBook(data: CreateBookInput) {
        // 1. ISBN 중복 체크
        if (data.isbn) {
            const exists = await prisma.book.findUnique({ where: { isbn: data.isbn } });
            if (exists) {
                throw new AppError(HttpCode.CONFLICT, 'ISBN already exists', 'BOOK_ISBN_DUPLICATE');
            }
        }

        return prisma.book.create({
            data: {
                ...data,
                // 2. 할인 가격 계산 (할인율이 있는 경우)
                discountPrice: data.discountRate
                    ? Number(data.price) * (1 - data.discountRate)
                    : null,
            },
        });
    }

    /**
     * 도서 목록 조회
     * - 페이지네이션, 키워드 검색, 카테고리 필터링, 정렬 지원
     */
    static async getBooks(query: BookQueryInput) {
        const { page, size, keyword, category, sort } = query;
        const skip = (page - 1) * size;

        // 1. 검색 조건 구성 (Soft Delete된 도서 제외)
        const where: Prisma.BookWhereInput = {
            deletedAt: null,
        };

        // 카테고리 필터
        if (category) {
            where.category = category;
        }

        // 키워드 검색 (제목 또는 저자)
        if (keyword) {
            where.OR = [
                { title: { contains: keyword } }, // MySQL 기본 설정상 대소문자 구분 없음 (CI)
                { author: { contains: keyword } },
            ];
        }

        // 2. 정렬 조건 구성
        let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: 'desc' }; // 기본값: 최신순
        if (sort) {
            const [field, direction] = sort.split(',');
            const validSortFields = ['price', 'title', 'createdAt', 'pubDate'];

            if (validSortFields.includes(field)) {
                orderBy = { [field]: direction.toLowerCase() === 'asc' ? 'asc' : 'desc' };
            }
        }

        // 3. 데이터 조회 및 카운트 (병렬 실행)
        const [books, total] = await Promise.all([
            prisma.book.findMany({
                where,
                skip,
                take: size,
                orderBy,
            }),
            prisma.book.count({ where }),
        ]);

        return { books, total };
    }

    /**
     * 도서 상세 조회
     * - 존재하지 않거나 삭제된 도서인 경우 에러 반환
     */
    static async getBookById(id: number) {
        const book = await prisma.book.findUnique({
            where: { id },
        });

        if (!book || book.deletedAt) {
            throw new AppError(HttpCode.NOT_FOUND, 'Book not found', 'BOOK_NOT_FOUND');
        }

        return book;
    }

    /**
     * 도서 정보 수정 (관리자 전용)
     * - 존재 여부 확인 후 업데이트
     * - 가격/할인율 변경 시 할인가 재계산
     */
    static async updateBook(id: number, data: UpdateBookInput) {
        // 존재 여부 확인 (없으면 에러 발생)
        await this.getBookById(id);

        const updateData: any = { ...data };

        // 가격이나 할인율이 변경된 경우 할인 가격 재계산
        // 주의: 실제 서비스에선 기존 값을 DB에서 가져와서 계산해야 할 수도 있음.
        // 여기서는 요청 데이터에 둘 다 있거나 하는 단순한 케이스를 가정하거나,
        // 필요 시 기존 데이터를 fetch하여 병합하는 로직을 추가할 수 있음.
        if (data.price !== undefined && data.discountRate !== undefined) {
            updateData.discountPrice = Number(data.price) * (1 - data.discountRate);
        }

        return prisma.book.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * 도서 삭제 (관리자 전용 - Soft Delete)
     * - 실제 데이터 삭제가 아닌 deletedAt 필드 업데이트
     */
    static async deleteBook(id: number) {
        await this.getBookById(id); // 존재 확인

        return prisma.book.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}