// src/controllers/order.controller.ts
import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { HttpCode, AppError } from '../utils/AppError';

/**
 * 주문 관련 HTTP 요청을 처리하는 컨트롤러
 */
export class OrderController {
    /**
     * 주문 생성
     * POST /orders
     */
    static async create(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const order = await OrderService.createOrder(req.user.userId, req.body);
        return successResponse(res, order, HttpCode.CREATED);
    }

    /**
     * 주문 목록 조회
     * GET /orders
     */
    static async findAll(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const page = Number(req.query.page) || 1;
        const size = Number(req.query.size) || 20;

        const { orders, total } = await OrderService.getOrders(
            req.user.userId,
            req.user.role,
            page,
            size
        );

        return paginatedResponse(res, orders, page, size, total);
    }

    /**
     * 주문 상세 조회
     * GET /orders/:id
     */
    static async findOne(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const orderId = Number(req.params.id);
        const order = await OrderService.getOrderById(
            req.user.userId,
            req.user.role,
            orderId
        );

        return successResponse(res, order);
    }

    /**
     * 주문 취소
     * POST /orders/:id/cancel
     */
    static async cancel(req: Request, res: Response) {
        if (!req.user) throw new AppError(HttpCode.UNAUTHORIZED, 'Login required');

        const orderId = Number(req.params.id);
        const order = await OrderService.cancelOrder(
            req.user.userId,
            req.user.role,
            orderId
        );

        return successResponse(res, order);
    }

    /**
     * 주문 상태 변경 (관리자)
     * PUT /orders/:id/status
     */
    static async updateStatus(req: Request, res: Response) {
        const orderId = Number(req.params.id);
        const { status } = req.body;

        const order = await OrderService.updateStatus(orderId, status);
        return successResponse(res, order);
    }
}