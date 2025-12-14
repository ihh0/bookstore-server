import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../validations/order.validation';

const router = Router();

// --------------------------------------------------------------------------
// Middleware Setup
// --------------------------------------------------------------------------
// 모든 주문 관련 라우트는 로그인이 필수입니다.
router.use(authenticate);

// --------------------------------------------------------------------------
// Public/User Routes (일반 사용자 접근 가능)
// --------------------------------------------------------------------------

// 1. 주문 생성
router.post(
    '/',
    validate(createOrderSchema),
    OrderController.create
);

// 2. 주문 목록 조회
router.get('/', OrderController.findAll);

// 3. 주문 상세 조회
router.get('/:id', OrderController.findOne);

// 4. 주문 취소
router.post('/:id/cancel', OrderController.cancel);

// --------------------------------------------------------------------------
// Admin Routes (관리자 전용)
// --------------------------------------------------------------------------

// 5. 주문 상태 변경 (배송 시작, 완료 등)
router.put(
    '/:id/status',
    authorize('admin'), // 관리자 권한 확인
    validate(updateOrderStatusSchema),
    OrderController.updateStatus
);

export default router;