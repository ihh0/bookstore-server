import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, refreshSchema } from '../validations/auth.validation';

const router = Router();

// --------------------------------------------------------------------------
// Public Routes (비로그인 사용자 접근 가능)
// --------------------------------------------------------------------------

// 1. 회원가입
router.post(
    '/register',
    validate(registerSchema), // 입력값 검증
    AuthController.register
);

// 2. 로그인
router.post(
    '/login',
    validate(loginSchema), // 입력값 검증
    AuthController.login
);

// --------------------------------------------------------------------------
// Protected Routes (로그인 사용자 전용)
// --------------------------------------------------------------------------

// 3. 로그아웃
router.post(
    '/logout',
    authenticate, // 토큰 검증 미들웨어 필수
    AuthController.logout
);

// 4. 토큰 재발급
router.post(
    '/refresh',
    validate(refreshSchema),
    AuthController.refresh
);

export default router;