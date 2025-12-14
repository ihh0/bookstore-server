// 관리자 계정과 초기 도서를 생성하는 스크립트입니다.
// 이 파일에서 직접 정보를 수정한 후 터미널에 npx prisma db seed 입력 시 수동으로 계정을 생성합니다.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. 관리자 계정
    const adminPassword = await bcrypt.hash('admin1234!', 10);
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            loginId: 'admin',
            email: 'admin@example.com',
            passwordHash: adminPassword,
            name: 'Super Admin',
            phoneNumber: '010-0000-0000',
            role: 'admin',
        },
    });

    // 2. 일반 유저 20명 생성
    const userPassword = await bcrypt.hash('password123!', 10);
    for (let i = 1; i <= 20; i++) {
        const loginId = `user${i}`;
        await prisma.user.upsert({
            where: { email: `user${i}@example.com` },
            update: {},
            create: {
                loginId: loginId,
                email: `user${i}@example.com`,
                passwordHash: userPassword,
                name: `User ${i}`,
                phoneNumber: `010-1000-${1000 + i}`,
                role: 'user',
            },
        });
    }

    // 3. 도서 200권 생성 (200건 충족 핵심)
    const categories = ['IT/컴퓨터', '소설', '경제/경영', '과학', '역사', '예술'];

    // 기존 데이터 초기화 (선택 사항 - 중복 방지 위해 upsert 사용하므로 생략 가능)
    // await prisma.book.deleteMany();

    for (let i = 1; i <= 200; i++) {
        const category = categories[i % categories.length];
        const isbn = `978-89-${1000 + i}-${2000 + i}`;

        await prisma.book.upsert({
            where: { isbn },
            update: {},
            create: {
                title: `테스트 도서 ${i}: ${category}의 세계`,
                author: `저자 ${i % 10 + 1}`, // 저자 10명 반복
                description: `이 책은 ${category} 분야의 필독서입니다. 상세 내용 ${i}...`,
                price: (Math.floor(Math.random() * 50) + 10) * 1000, // 10,000 ~ 60,000원
                stockQuantity: Math.floor(Math.random() * 100), // 0 ~ 99권
                isbn,
                publishedDate: new Date(2020, i % 12, (i % 28) + 1),
                category,
                discountRate: i % 5 === 0 ? 0.1 : 0, // 5권마다 10% 할인
                discountPrice: i % 5 === 0 ? undefined : null, // (트리거 로직이 없으므로 계산 생략 or 직접 계산)
            },
        });
    }

    // 4. 주문 및 리뷰 데이터 일부 생성 (통계용)
    // 유저 1이 1~10번 책을 주문하고 리뷰 남김
    const user1 = await prisma.user.findUnique({ where: { loginId: 'user1' } });
    if (user1) {
        // 주문 5건
        for (let i = 1; i <= 5; i++) {
            await prisma.order.create({
                data: {
                    userId: user1.uid,
                    orderNumber: `ORD-SEED-${i}`,
                    totalPrice: 50000,
                    shippingAddress: '서울시 강남구',
                    status: 'paid',
                    orderItems: {
                        create: [
                            { bookId: i, quantity: 1, price: 50000, subtotal: 50000 }
                        ]
                    }
                }
            });
        }

        // 리뷰 10건
        for (let i = 1; i <= 10; i++) {
            await prisma.review.create({
                data: {
                    userId: user1.uid,
                    bookId: i,
                    rating: Math.floor(Math.random() * 5) + 1,
                    content: `시드 데이터로 생성된 리뷰입니다. ${i}`
                }
            });
        }
    }

    console.log('✅ Seed data (200+ rows) created successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });