import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

/**
 * 로그 출력 형식 정의
 * 예: 2024-03-05 12:00:00 [info]: Server started
 */
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

/**
 * Winston 로거 인스턴스 생성
 * - 개발 환경: Console에 컬러풀하게 출력
 * - 운영 환경: 파일로 로그 저장 (error.log, combined.log)
 */
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        // 콘솔 출력 설정
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
        // 파일 저장 설정 (운영 환경용)
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});