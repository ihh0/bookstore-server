import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { addToCartSchema, updateCartItemSchema } from '../validations/cart.validation';

const router = Router();

// --------------------------------------------------------------------------
// Middleware Setup
// --------------------------------------------------------------------------
// 모든 장바구니 기능은 로그인이 필수입니다.
router.use(authenticate);

// --------------------------------------------------------------------------
// Cart Routes
// --------------------------------------------------------------------------

// 1. 장바구니 담기
router.post(
    '/',
    validate(addToCartSchema), // 입력값 검증
    CartController.addToCart
);

// 2. 장바구니 목록 조회
router.get('/', CartController.getCartItems);

// 3. 장바구니 아이템 삭제
router.delete('/:id', CartController.removeCartItem);

// 4. 장바구니 수량 변경
router.put(
    '/:id',
    validate(updateCartItemSchema), // 입력값 검증
    CartController.updateCartItem
);

export default router;