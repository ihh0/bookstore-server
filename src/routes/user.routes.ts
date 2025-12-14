import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { updateUserSchema, updatePasswordSchema } from '../validations/user.validation';

const router = Router();

// 모든 사용자 관련 라우트는 로그인이 필수입니다.
router.use(authenticate);

// 1. 내 정보 조회
router.get('/me', UserController.getMe);

// 2. 내 정보 수정
router.put(
    '/me',
    validate(updateUserSchema),
    UserController.updateMe
);

// 3. 비밀번호 변경
router.put(
    '/password',
    validate(updatePasswordSchema),
    UserController.updatePassword
);

// 4. 회원 탈퇴
router.delete('/me', UserController.deleteMe);

export default router;