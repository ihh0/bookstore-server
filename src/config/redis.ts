import { createClient } from 'redis';
import { logger } from './logger';

/**
 * Redis 클라이언트 생성
 * - JWT Refresh Token 관리 및 로그아웃(Blacklist) 처리에 사용
 */
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// 에러 이벤트 핸들링
redisClient.on('error', (err) => {
    logger.error(`Redis Client Error: ${err}`);
});

// 연결 성공 이벤트 핸들링
redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
});

/**
 * Redis 서버 연결 함수
 * - 서버 시작 시 호출되어 Redis 서버와 연결합니다.
 * - 연결 실패 시 에러를 로깅하고, 치명적인 오류로 간주하여 프로세스를 종료합니다.
 */
export const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        logger.error('Failed to connect to Redis', error);
        process.exit(1);
    }
};

export default redisClient;