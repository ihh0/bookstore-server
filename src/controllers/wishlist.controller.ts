import { Request, Response } from 'express';
import { WishlistService } from '../services/wishlist.service';
import { successResponse } from '../utils/response';
import { HttpCode, AppError } from '../utils/AppError';

/**
 * 위시리스트 관련 HTTP 요청 핸들러
 */
export class WishlistController {
    /**
     * 위시리스트 추가
     * POST /wishlist
     */
    static async add(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const { bookId } = req.body;
        const wishlist = await WishlistService.addWishlist(req.user.userId, bookId);
        return successResponse(res, wishlist, HttpCode.CREATED);
    }

    /**
     * 위시리스트 삭제
     * DELETE /wishlist/:bookId
     */
    static async remove(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const bookId = Number(req.params.bookId);
        await WishlistService.removeWishlist(req.user.userId, bookId);
        return successResponse(res, { message: 'Removed from wishlist' });
    }

    /**
     * 내 위시리스트 조회
     * GET /wishlist
     */
    static async getAll(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const items = await WishlistService.getWishlist(req.user.userId);
        return successResponse(res, items);
    }
}