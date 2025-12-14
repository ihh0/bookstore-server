// [중요] 환경변수 로드가 가장 먼저 수행되어야 함
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './config/logger';
import { connectRedis } from './config/redis';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 3000;

/**
 * 서버 시작 함수
 * 1. 데이터베이스 연결
 * 2. Redis 연결
 * 3. Express 앱 포트 바인딩
 */
const startServer = async () => {
    try {
        // 1. Database 연결
        await connectDB();

        // 2. Redis 연결
        await connectRedis();

        // 3. 서버 실행
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        });

        // Graceful Shutdown 처리
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                logger.info('Process terminated.');
            });
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();