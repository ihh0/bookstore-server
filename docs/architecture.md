# 코드 구조

## 1. 흐름
<pre><code>Client (Postman/Web)
⬇️ HTTP Request
[ Router (Routes) ]      : URL 라우팅 및 미들웨어 연결
⬇️
[ Middleware ]           : 인증(Auth), 유효성 검사(Zod), 로깅
⬇️
[ Controller ]           : 요청 파싱, 서비스 호출, 응답 반환 (HTTP 계층)
⬇️
[ Service ]              : 비즈니스 로직, 트랜잭션 관리, 예외 처리 (Core)
⬇️
[ Data Access (Prisma) ] : 데이터베이스 쿼리 수행
⬇️
Database (MySQL / Redis)
</code></pre>

## 2. 디렉토리 구조
<pre><code>bookstore-server
├── .env                    # 환경변수 (DB 접속 정보, 비밀키 등 - Git 제외)
├── package.json            # 의존성 및 스크립트 관리
├── ecosystem.config.js     # PM2 배포 설정 파일
├── prisma
│   ├── schema.prisma       # 데이터베이스 모델링 및 설정
│   ├── seed.ts             # 초기 데이터(Seed) 생성 스크립트
│   └── migrations/         # DB 마이그레이션 히스토리
├── src
│   ├── config/             # 환경 설정 (DB 연결, 로거, Swagger 등)
│   ├── controllers/        # 컨트롤러 계층 (HTTP 요청/응답 처리)
│   ├── docs/               # Swagger API 명세서 (YAML)
│   ├── middlewares/        # 미들웨어 (인증, 검증, 에러 핸들링)
│   ├── routes/             # 라우터 정의 (URL Endpoint)
│   ├── services/           # 서비스 계층 (비즈니스 로직)
│   ├── utils/              # 유틸리티 함수 (JWT, 응답 포맷, 에러 클래스)
│   ├── validations/        # 요청 데이터 검증 스키마 (Zod)
│   ├── app.ts              # Express 앱 설정 (미들웨어 장착)
│   └── server.ts           # 서버 진입점 (포트 바인딩)
└── tests/                  # 테스트 코드 (Jest)
</code>
</pre>

## 3. 계층별 역할 상세 (Layer Details)

### 3-1. Presentation Layer (Routes & Controllers)

클라이언트와 직접 소통하는 계층입니다. 비즈니스 로직을 포함하지 않으며, "무엇을 할지"를 결정하여 서비스 계층에 위임합니다.

* src/routes/*.routes.ts
  * URL 경로(Endpoint)와 HTTP 메서드를 정의합니다.
  * 해당 경로에 필요한 미들웨어(authenticate, validate)를 체이닝합니다.

* src/controllers/*.controller.ts
  * req 객체에서 파라미터, 바디, 쿼리를 추출합니다.
  * Service 메서드를 호출하여 작업을 수행합니다.
  * 결과를 받아 표준 응답 포맷(successResponse)으로 클라이언트에 반환합니다.

### 3-2. Business Logic Layer (Services)

애플리케이션의 핵심 로직이 존재하는 계층입니다. "어떻게 할지"를 정의합니다.

* src/services/*.service.ts
  * 데이터 가공, 계산, 조건 체크를 수행합니다.
  * DB 접근이 필요한 경우 Prisma Client를 사용합니다.
  * 트랜잭션(prisma.$transaction)을 관리하여 데이터 무결성을 보장합니다.
  * 예외 상황 발생 시 AppError를 throw 합니다.

### 3-3. Cross-Cutting Concerns (Middlewares & Utils)

애플리케이션 전반에 걸쳐 공통적으로 사용되는 기능들입니다.

* src/middlewares/
  * auth.middleware.ts: JWT 토큰을 검증하고 req.user에 사용자 정보를 주입합니다.
  * validate.ts: Zod 스키마를 이용해 요청 데이터의 유효성을 검사합니다.
  * errorHandler.ts: 발생한 모든 에러를 포착하여 통일된 JSON 형식으로 반환합니다.

* src/utils/
  * jwt.ts: 토큰 발급 및 검증 로직. Redis와 연동하여 Refresh Token을 관리합니다.
  * AppError.ts: HTTP 상태 코드와 에러 메시지를 관리하는 커스텀 에러 클래스입니다.

## 4. 데이터 흐름 예시: 주문 생성 (Create Order)

사용자가 주문 생성(POST /orders) 요청을 보냈을 때의 내부 흐름입니다.

1. Route (routes/order.routes.ts):

* 요청 수신. 
* authenticate 미들웨어 실행 -> 로그인 여부 확인. 
* validate(createOrderSchema) 실행 -> 입력값(상품 ID, 수량 등) 검증. 
* 검증 통과 시 OrderController.create 호출.

2. Controller (controllers/order.controller.ts):

* req.user.userId (주문자)와 req.body (주문 내용) 추출. 
* OrderService.createOrder 호출.

3. Service (services/order.service.ts):

* 트랜잭션 시작. 
* 도서 재고 확인 (재고 부족 시 409 Conflict 에러). 
* 결제 금액 계산. 
* DB 작업 1: 도서 재고 차감 (update). 
* DB 작업 2: 주문 및 주문 상세 내역 저장 (create). 
* 트랜잭션 커밋 및 결과 반환.

4. Response:

* Controller가 Service의 결과를 받아 201 Created 응답 반환.

## 5. 주요 기술적 결정 사항

* Prisma ORM: Type-safe한 DB 접근과 마이그레이션 관리를 위해 사용. 
* Zod: 런타임 데이터 검증을 위해 사용하며, TypeScript 타입 추론과 연동됨. 
* Redis: JWT Refresh Token 저장소로 활용하여, 로그아웃 시 토큰을 즉시 무효화(Blacklist/Removal)하는 보안 전략 적용. 
* Layered Architecture: 유지보수성과 테스트 용이성을 높이기 위해 철저한 계층 분리 적용.

6. 모듈별 상세 구성 (Module Structure)

본 프로젝트는 기능별로 파일이 모여있는 구조(Domain-driven directory)가 아닌, 
계층별로 파일이 분산된 구조(Layer-driven directory)를 따릅니다.
각 도메인(모듈)이 어떤 파일들로 구성되어 있는지 아래 표로 정리합니다.

|모듈 (Domain)|주요 기능 |관련 파일 (Controller / Service / Route / Validation)|
|-|-|-|
|Auth (인증)|회원가입, 로그인, 토큰 재발급, 로그아웃|auth.controller.ts, auth.service.ts, auth.routes.ts, auth.validation.ts|
|User (사용자)|내 정보 조회/수정, 비밀번호 변경, 탈퇴|user.controller.ts, user.service.ts, user.routes.ts, user.validation.ts|
|Book (도서)|도서 목록(검색/필터), 상세 조회, 관리자 CRUD|book.controller.ts, book.service.ts, book.routes.ts, book.validation.ts|
|Order (주문)|주문 생성(트랜잭션), 조회, 취소, 상태 변경|order.controller.ts, order.service.ts, order.routes.ts, order.validation.ts|
|Cart (장바구니)|장바구니 담기, 조회, 수량 수정, 삭제|cart.controller.ts, cart.service.ts, cart.routes.ts, cart.validation.ts|
|Review (리뷰)|리뷰/댓글 작성, 조회, 삭제, 좋아요 토글|review.controller.ts, review.service.ts, review.routes.ts, review.validation.ts|
|Wishlist (찜)|위시리스트 추가, 조회, 삭제|wishlist.controller.ts, wishlist.service.ts, wishlist.routes.ts, wishlist.validation.ts|