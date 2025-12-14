import { TokenPayload } from '../utils/jwt';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload; // JWT 페이로드 (userId, role)
        }
    }
}

export {};