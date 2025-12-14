import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { AppError, HttpCode } from '../utils/AppError';
import { generateTokens, removeRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validations/auth.validation';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * 인증 및 사용자 계정 관리를 담당하는 서비스 클래스
 */
export class AuthService {
    /**
     * 회원가입
     * 1. 중복 검사 (아이디, 이메일, 전화번호)
     * 2. 비밀번호 암호화 (bcrypt)
     * 3. 사용자 레코드 생성
     */
    static async register(data: RegisterInput) {
        // 1. 중복 가입 여부 확인
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { loginId: data.id },
                    { email: data.email },
                    { phoneNumber: data.phoneNumber },
                ],
            },
        });

        if (existingUser) {
            if (existingUser.loginId === data.id) {
                throw new AppError(HttpCode.CONFLICT, 'ID already exists', 'AUTH_DUPLICATE_ID');
            }
            if (existingUser.email === data.email) {
                throw new AppError(HttpCode.CONFLICT, 'Email already exists', 'AUTH_DUPLICATE_EMAIL');
            }
            if (existingUser.phoneNumber === data.phoneNumber) {
                throw new AppError(HttpCode.CONFLICT, 'Phone number already exists', 'AUTH_DUPLICATE_PHONE');
            }
        }

        // 2. 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // 3. 사용자 생성
        const newUser = await prisma.user.create({
            data: {
                loginId: data.id,
                email: data.email,
                passwordHash: hashedPassword,
                name: data.name,
                phoneNumber: data.phoneNumber,
                address: data.address,
                role: 'user', // 기본 권한은 일반 유저
            },
        });

        // 보안상 비밀번호 해시를 제외하고 반환
        const { passwordHash, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    /**
     * 로그인
     * 1. 사용자 조회 (ID 기준)
     * 2. 비밀번호 검증
     * 3. JWT 토큰(Access/Refresh) 발급 및 Redis 저장
     */
    static async login(data: LoginInput) {
        // 1. 사용자 조회
        const user = await prisma.user.findUnique({
            where: { loginId: data.id },
        });

        // 2. 사용자 검증 (존재 여부, 탈퇴 여부, 비밀번호 일치 여부)
        if (!user || user.deletedAt) {
            throw new AppError(HttpCode.UNAUTHORIZED, 'Invalid credentials', 'AUTH_FAILED');
        }

        const isMatch = await bcrypt.compare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new AppError(HttpCode.UNAUTHORIZED, 'Invalid credentials', 'AUTH_FAILED');
        }

        // 3. 토큰 발급
        const tokens = await generateTokens(user.uid, user.role);

        return { user, tokens };
    }

    /**
     * 로그아웃
     * - Redis에 저장된 Refresh Token 삭제
     */
    static async logout(userId: number) {
        await removeRefreshToken(userId);
    }

    /**
     * 토큰 재발급
     * - Redis에 저장된 Refresh Token 유효성 검사 후 새 토큰 발급
     */
    static async refreshTokens(data: { refreshToken: string }) {
        // 1. Refresh Token 검증 (유효기간, Redis 저장 여부)
        // verifyRefreshToken 내부에서 Redis 체크까지 수행함
        const payload = await verifyRefreshToken(data.refreshToken);

        // 2. 사용자 상태 재확인 (탈퇴했거나 권한이 변경되었을 수 있음)
        const user = await prisma.user.findUnique({ where: { uid: payload.userId } });
        if (!user || user.deletedAt) {
            throw new AppError(HttpCode.UNAUTHORIZED, 'User invalid or deleted', 'AUTH_USER_INVALID');
        }

        // 3. 토큰 재발급 (Rotate)
        // 보안을 위해 Refresh Token도 새로 발급하여 교체
        const newTokens = await generateTokens(user.uid, user.role);

        return newTokens;
    }
}