import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { addWishlistSchema, removeWishlistSchema } from '../validations/wishlist.validation';

const router = Router();

// 모든 위시리스트 기능은 로그인이 필요합니다.
router.use(authenticate);

// 1. 위시리스트 추가
router.post(
    '/',
    validate(addWishlistSchema),
    WishlistController.add
);

// 2. 위시리스트 목록 조회
router.get('/', WishlistController.getAll);

// 3. 위시리스트 삭제
router.delete(
    '/:bookId',
    validate(removeWishlistSchema),
    WishlistController.remove
);

export default router;