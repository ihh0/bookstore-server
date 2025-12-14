# 📚 Bookstore Server (Express Backend)

## 1. 프로젝트 개요

### 🎯 문제 정의 및 목표

본 프로젝트는 온라인 서점 서비스를 위한 RESTful API 백엔드 서버입니다.
사용자 관리, 도서 검색, 장바구니, 주문 결제(모의), 커뮤니티(리뷰) 기능을 포함하며, 대규모 트래픽을 고려한 확장성 있는 아키텍처와 데이터 무결성(트랜잭션) 처리를 목표로 합니다.
사용한 도구는 JetBrains WebStorm과 Google Gemini 3 입니다.

### ✨ 주요 기능

* 인증/인가: JWT(Access/Refresh) 기반 인증 및 Redis를 활용한 토큰 관리 (RTR 적용).

* 도서 관리: 카테고리별/키워드별 검색, 정렬, 페이지네이션 지원.

* 주문 시스템: 재고(Stock) 차감과 주문 생성을 원자적(Atomic)으로 처리하는 트랜잭션 로직.

* 커뮤니티: 도서 리뷰 및 대댓글 작성, 좋아요(Like) 상호작용 기능.

* 장바구니/위시리스트: 사용자별 개인화된 상품 관리 기능.

* 문서화: Swagger UI를 통한 API 명세 자동화 및 테스트 환경 제공.

## 2. 실행 방법 (Local)

### 사전 요구사항 (Prerequisites)

* Node.js (v18 이상 권장)

* MySQL (v8.0)

* Redis

### 단계별 설치 및 실행

#### 1. 레포지토리 클론 및 의존성 설치

<pre><code>git clone {repository-url}
cd bookstore-server
npm install </code></pre>

#### 2. 환경 변수 설정
<pre><code>cp .env.example .env
# .env 파일을 열어 DB_URL, REDIS_URL 등을 본인 환경에 맞게 수정하세요.
</code></pre>

#### 3. 데이터베이스 마이그레이션 및 시드 데이터 생성
<pre><code># 테이블 생성
npx prisma migrate dev --name init

# 시드 데이터(도서 200권, 관리자, 유저 등) 생성
npx prisma db seed
</code></pre>

#### 4. 서버 실행

<pre><code># 개발 모드 (소스 수정 시 자동 재시작)
npm run dev

# 프로덕션 모드
npm run build
npm start
</code></pre>


## 3. 환경변수 설명 (.env)

프로젝트 루트의 .env 파일에 설정해야 할 값들입니다. (.env.example 참고)


|변수명|설명|예시 값|
|------|-|---|
|PORT|서버 포트 번호|3000|
|NODE_ENV|실행 환경|development|
|DATABASE_URL|MySQL 접속 URL|mysql://root:password@localhost:3306/bookstore_db|
|REDIS_URL|Redis 접속 URL|redis://localhost:6379|
|JWT_SECRET|JWT 서명 비밀키|your_super_secret_key|
|JWT_ACCESS_EXPIRATION|Access Token 만료 시간|15m|
|JWT_REFRESH_EXPIRATION|Refresh Token 만료 시간|7d|
|CORS_ORIGIN|허용할 클라이언트 도메인|http://localhost:5173|


## 4. 배포 주소 및 URL

로컬 개발 환경 기준 주소입니다.

Base URL: http://localhost:3000

Swagger Docs: http://localhost:3000/docs (API 명세 및 테스트)

Health Check: http://localhost:3000/health

## 5. 인증 플로우 (Auth Flow)

본 서버는 JWT (JSON Web Token) 방식을 사용하여 Stateless한 인증을 구현하되, 보안을 위해 Redis를 함께 사용합니다.

로그인: POST /auth/login 성공 시 accessToken(15분)과 refreshToken(7일) 발급.

Refresh Token 저장: 발급된 Refresh Token은 서버의 Redis에 저장 (Whitelist 관리).

API 요청: 클라이언트는 Authorization: Bearer <accessToken> 헤더를 포함하여 요청.

토큰 만료 시: POST /auth/refresh로 요청하면, Redis의 Refresh Token 유효성을 검사한 후 새로운 토큰 쌍 발급 (RTR: Refresh Token Rotation 적용).

로그아웃: Redis에서 해당 유저의 Refresh Token을 삭제하여 즉시 무효화.

## 6. 역할 및 권한 (Roles & Permissions)

|기능 (Resource)| API 메서드    | ROLE_USER (일반) | ROLE_ADMIN (관리자) |
|---|------------|----------------|------------------|
|도서 (Books)|조회 (GET)| ✅              | ✅                |
||등록/수정/삭제| ❌              | ✅                |
|주문 (Orders)|생성/취소 (POST)| ✅ (본인 것만)      | ✅ (전체)           |
||목록/상세 조회| ✅ (본인 것만)      | ✅ (전체)           |
||상태 변경 (배송 등)| ❌              | ✅                |
|리뷰 (Reviews)|작성/수정/삭제| ✅ (본인 것만)      | ✅ (전체)           |
|회원 (Users)|정보 수정/탈퇴| ✅ (본인 것만)      | -                |

## 7. 예제 계정 (Seed Data)

npx prisma db seed 명령어로 생성되는 테스트용 계정입니다.

| 역할    |아이디 (ID)|비밀번호 (PW)| 비고  |
|-------|---|---|-----|
| 관리자   |admin|admin1234!|모든 권한 보유|
| 일반 유저 |user1|password123!|일반 사용자 (user1 ~ user20 생성됨)|


## 8. DB 연결 정보 (로컬 테스트용)

개발 환경에서 데이터베이스에 직접 접속하여 데이터를 확인하고 싶을 때 사용합니다.

* DBMS: MySQL 8.0

* Host: localhost

* Port: 3306

* Database: bookstore_db (설정에 따라 다름)

* User/Password: 로컬 MySQL 설정 값 사용

## 9. 엔드포인트 요약

| 태그     |메서드|URL|설명|
|--------|-|-|-|
| Auth   |POST|/auth/register|회원가입|
|        |POST|/auth/login|로그인 (토큰 발급)|
|        |POST|/auth/refresh|토큰 재발급|
| Books  |GET|/books|도서 목록 조회 (검색/필터)|
|        |POST|/books|도서 등록 (Admin)|
| Orders |POST|/orders|주문 생성|
||GET|/orders|주문 목록 조회|
|Reviews|GET|/reviews|리뷰 목록 조회|
||POST|/reviews|리뷰 작성|
|Cart|POST|/carts|장바구니 담기|
|Users|GET|/users/me|내 정보 조회|

(상세한 명세는 /docs의 Swagger UI를 참고하세요)

## 10. 성능 및 보안 고려사항

* 보안 (Security)
  * Helmet: HTTP 헤더 보안 설정.
  * CORS: 환경변수를 통한 허용 도메인 관리.
  * Input Validation: Zod를 이용한 엄격한 요청 데이터 검증.
  * Password Hashing: bcrypt를 이용한 단방향 암호화.

* 성능 (Performance)
  * Pagination: 대량의 데이터 조회 시 부하 방지를 위해 모든 목록 조회 API에 페이지네이션 적용.
  * Indexing: Prisma Schema에 검색 및 조인이 잦은 필드(userId, bookId, email 등)에 인덱스 적용.
  * N+1 방지: Prisma의 include 옵션을 적절히 사용하여 관계 데이터를 효율적으로 로딩.
  * Request Limit: express.json({ limit: '10mb' })로 과도한 페이로드 전송 방지.

## 11. 한계와 개선 계획

### 현재의 한계 (Limitations)

* 검색 기능: 현재 MySQL LIKE 쿼리를 사용하므로 대량 데이터 검색 시 성능 저하 우려.

* 카테고리 테이블: 책의 정보에 저장되는 카테고리가 단순 문자열로 구성됨.

* 결제 연동: PG사 연동 없이 로직상으로만 결제 완료 처리됨.

* 이미지 업로드: 실제 파일 업로드가 아닌 URL 문자열 저장 방식 사용.

* 주문 취소 요청 시스템: 주문 취소를 요청하고, 관리자가 승인하는 구조 미구현.

### 향후 개선 계획 (Roadmap)

* 카테고리 테이블 추가 및 도서 검색에 적용

* 도서 표지를 업로드하고 저장하는 기능 구현.

* GitHub Actions를 이용한 자동 배포 파이프라인 구축.