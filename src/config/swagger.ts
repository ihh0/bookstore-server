import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bookstore API Documentation',
            version: '1.0.0',
            description: 'Node.js Express Bookstore REST API',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                // 공통 에러 응답 스키마 예시
                Error: {
                    type: 'object',
                    properties: {
                        timestamp: { type: 'string', format: 'date-time' },
                        path: { type: 'string' },
                        status: { type: 'integer' },
                        code: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // 주석을 읽어들일 파일 경로
    apis: ['src/docs/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);