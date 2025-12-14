import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { successResponse } from '../utils/response';
import { HttpCode, AppError } from '../utils/AppError';

/**
 * 장바구니 관련 HTTP 요청을 처리하는 컨트롤러
 */
export class CartController {
    /**
     * 장바구니 담기
     * POST /carts
     */
    static async addToCart(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const cartItem = await CartService.addToCart(req.user.userId, req.body);
        return successResponse(res, cartItem, HttpCode.CREATED);
    }

    /**
     * 장바구니 목록 조회
     * GET /carts
     */
    static async getCartItems(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const items = await CartService.getCartItems(req.user.userId);
        return successResponse(res, items);
    }

    /**
     * 장바구니 아이템 삭제
     * DELETE /carts/:id
     */
    static async removeCartItem(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const cartId = Number(req.params.id);
        await CartService.removeFromCart(req.user.userId, cartId);

        return successResponse(res, { message: 'Item removed from cart' });
    }

    /**
     * 장바구니 수량 변경
     * PUT /carts/:id
     */
    static async updateCartItem(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const cartId = Number(req.params.id);
        const { quantity } = req.body;

        const updatedItem = await CartService.updateQuantity(req.user.userId, cartId, quantity);
        return successResponse(res, updatedItem);
    }
}