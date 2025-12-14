module.exports = {
    apps: [
        {
            name: 'bookstore-server',
            script: './dist/server.js', // 빌드된 JS 파일 실행
            instances: 'max', // CPU 코어 수만큼 인스턴스 실행 (클러스터 모드)
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            // 로그 설정
            output: './logs/pm2-out.log',
            error: './logs/pm2-error.log',
            merge_logs: true,
            // 재시작 정책
            wait_ready: true,
            listen_timeout: 50000,
            kill_timeout: 5000,
        },
    ],
};