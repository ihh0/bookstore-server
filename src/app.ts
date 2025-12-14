import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';

// 라우터 모듈 import
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import cartRoutes from './routes/cart.routes';
import reviewRoutes from './routes/review.routes';
import wishlistRoutes from './routes/wishlist.routes';

const app = express();

// --------------------------------------------------------------------------
// 1. 미들웨어 함수
// --------------------------------------------------------------------------
app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); // 요청 크기 제한
app.use(express.urlencoded({ extended: true }));

// HTTP 요청 로깅 (Winston 연동)
const stream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};
app.use(morgan('combined', { stream }));

// --------------------------------------------------------------------------
// 2. Swagger docs (API 문서)
// --------------------------------------------------------------------------
// http://localhost:3000/docs 로 접속하여 API 문서를 확인
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------------------------------------------------------------------
// 3. 헬스체크
// --------------------------------------------------------------------------
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// --------------------------------------------------------------------------
// 4. API 라우팅
// --------------------------------------------------------------------------
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/orders', orderRoutes);
app.use('/users', userRoutes);
app.use('/carts', cartRoutes);
app.use('/reviews', reviewRoutes);
app.use('/wishlist', wishlistRoutes);

// --------------------------------------------------------------------------
// 5. 에러 핸들러
// --------------------------------------------------------------------------
// 404 Not Found 핸들러
app.use((req, res, next) => {
    res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'NOT_FOUND',
        message: '요청한 리소스를 찾을 수 없습니다.',
    });
});

// 글로벌 에러 핸들러
app.use(errorHandler);

export default app;