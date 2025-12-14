import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Prisma Client 인스턴스 생성
 * - 애플리케이션 전역에서 사용할 싱글톤 인스턴스입니다.
 * - 개발 환경(development)에서는 쿼리 로그를 포함한 상세 로그를 출력합니다.
 * - 운영 환경(production)에서는 에러 로그만 출력하여 성능을 최적화합니다.
 */
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});

/**
 * 데이터베이스 연결 함수
 * - 서버 시작 시 호출되어 MySQL 데이터베이스와의 연결을 수립합니다.
 * - 연결 실패 시 에러를 로깅하고, 치명적인 오류로 간주하여 프로세스를 종료합니다.
 */
const connectDB = async () => {
    try {
        await prisma.$connect();
        logger.info('MySQL Database Connected via Prisma');
    } catch (error) {
        logger.error('Database Connection Failed', error);
        process.exit(1);
    }
};

export { prisma, connectDB };