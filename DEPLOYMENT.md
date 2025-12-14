# 🚀 Private Cloud Deployment Guide

사설 클라우드(AWS EC2, Naver Cloud, On-premise 등) 환경에 bookstore-server를 배포하기 위한 체크리스트 및 가이드입니다.

## 1. 📋 배포 전 준비 사항 (Checklist)

### 1-1. 서버 환경 구성

* Node.js 설치: LTS 버전(v18 이상) 설치 권장.
* Database 준비: MySQL 8.0 및 Redis가 설치되어 있거나, 접근 가능한 엔드포인트가 있어야 합니다.
  * MySQL 설치 (Ubuntu 기준):
<pre><code>sudo apt update
sudo apt install mysql-server

# mysql 서버 실행
sudo systemctl start mysql
</code></pre>
  * Redis 설치 (Ubuntu 기준):
<pre><code>sudo apt update # 위에서 입력했으면 생략
sudo apt install redis-server

# 설치 확인 (PONG 응답 시 성공)
redis-cli ping
</code></pre>
* PM2 설치: 무중단 서비스 및 자동 재시작을 위해 전역 설치합니다.
<pre><code>npm install -g pm2</code></pre>

### 1-2. 네트워크 및 보안 설정

* 방화벽(Inbound Rules): 서버의 3000 포트(또는 설정한 포트)가 외부에서 접근 가능한지 확인하세요. (Nginx 사용 시 80/443만 오픈)
* 환경 변수 분리: .env 파일은 깃허브에 올리지 말고, 서버에 직접 생성해야 합니다.

## 2. 🛠️ 배포 단계 (Step-by-Step)

### 2-1. 프로젝트 클론 및 의존성 설치

서버에 접속하여 프로젝트를 내려받습니다.
<pre><code>
git clone &ltYOUR_REPOSITORY_URL&gt
cd bookstore-server
npm install --production=false # 빌드를 위해 devDependencies도 필요함
</code></pre>

### 2.2 환경 변수 설정 (.env)

서버에 .env 파일을 생성하고 운영용 값으로 채워 넣습니다.
<pre><code>vim .env
</code></pre>

$$필수 변경 항목$$

* NODE_ENV=production
* DATABASE_URL: 실제 운영 DB 주소
* REDIS_URL: 실제 운영 Redis 주소
* JWT_SECRET: 복잡하고 긴 임의의 문자열로 반드시 변경
* CORS_ORIGIN: 실제 프론트엔드 도메인 주소

### 2-3. 데이터베이스 마이그레이션

운영 DB에 테이블을 생성합니다. (주의: 운영 DB 데이터 손실 주의)
<pre><code>npx prisma migrate deploy
# seed 데이터가 필요하다면: npx prisma db seed
</code></pre>

### 2-4. 빌드 (TypeScript -> JavaScript)

TypeScript 코드를 Node.js가 실행할 수 있는 JavaScript로 컴파일합니다.
<pre><code>npm run build
</code></pre>

<code>dist</code> 폴더가 생성되었는지 확인하세요.

### 2-5. 서버 실행 (PM2)

작성해둔 ecosystem.config.js를 사용하여 서버를 실행합니다.
<pre><code># 프로덕션 모드로 실행
pm2 start ecosystem.config.js --env production

# 상태 확인
pm2 status
pm2 logs
</code></pre>

# 3. 🔄 운영 및 유지보수

### 자동 재시작 설정

서버가 재부팅되어도 PM2가 자동으로 실행되도록 설정합니다.
<pre><code>pm2 startup
pm2 save
</code></pre>

### 업데이트 배포

코드가 수정되었을 때의 배포 절차입니다.
<pre><code>git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 reload bookstore-server
</code></pre>



