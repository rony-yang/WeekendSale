const puppeteer = require('puppeteer'); // 웹스크래핑과 자동화를 제공하는 도구. 헤드리스 모드 사용

// 홈플러스 데이터를 스크래핑하는 함수
async function scrapeHomeplusData() {
    let martData = {
        homeplus: {
            eggItemsWithinPromotionPeriod: [], // HTML로 넘길 데이터
            promotionPeriod: '', // 행사 기간
            error: null,
        },
    };

    const homeplusURL = 'https://mfront.homeplus.co.kr/leaflet?gnbNo=207&homeType=MART';

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0); // 기본 네비게이션 타임아웃 해제

        // 홈플러스 웹 페이지로 이동
        await page.goto(homeplusURL);

        // 1초 동안 대기
        await new Promise(resolve => setTimeout(resolve, 1000)); // setTimeout이 1초뒤 완료되면 resolve가 호출(Promise 객체를 완료)

        // 행사 기간 텍스트 추출
        martData.homeplus.promotionPeriod = await page.evaluate(() => { // page.evaluate는 특정 데이터를 가져오기 위한 puppeteer 메서드
            const periodElement = document.querySelector('.css-xoi455.ejs6tb3');
            return periodElement ? periodElement.textContent.trim() : '할인 행사 기간 정보를 찾을 수 없습니다.';
        });

        // console.log('=== 행사 기간 텍스트 ===');
        // console.log(martData.homeplus.promotionPeriod);

        // 행사 기간 텍스트를 날짜 범위로 변환
        const promotionPeriodDates = martData.homeplus.promotionPeriod.match(/\d{4}\.\d{2}\.\d{2}/g); // 날짜만 추출
        let promoStartDate = null;
        let promoEndDate = null;

        if (promotionPeriodDates && promotionPeriodDates.length === 2) {
            const formatDate = dateStr => dateStr.replace(/\./g, '-'); // YYYY-MM-DD 형식 변환
            promoStartDate = formatDate(promotionPeriodDates[0]);
            promoEndDate = formatDate(promotionPeriodDates[1]);

            // console.log(`=== 행사 기간 날짜 ===`);
            // console.log(`시작: ${promoStartDate}`);
            // console.log(`종료: ${promoEndDate}`);
        } else {
            console.error('행사 기간을 올바르게 변환할 수 없습니다. 원본 텍스트:', martData.homeplus.promotionPeriod);
            throw new Error('행사 기간 포맷이 잘못되었습니다.');
        }

        // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식 가져오기

        // 행사 기간 내 포함 여부 확인
        const isWithinPromotionPeriod = promoStartDate <= todayDate && todayDate <= promoEndDate; // 날짜 비교

        if (!isWithinPromotionPeriod) {
            martData.homeplus.error = `오늘 날짜는 행사 기간(${promoStartDate} ~ ${promoEndDate})에 포함되지 않습니다.`;
            await browser.close();
            return martData; // 행사 기간 내에 포함되지 않으면 데이터를 반환하지 않음
        }

        // console.log('=== 오늘 날짜 비교 결과 ===');
        // console.log(`오늘 날짜: ${todayDate}`);
        // console.log(`행사 기간 내 포함 여부: ${isWithinPromotionPeriod}`);

        // 홈플러스 데이터 스크래핑
        martData.homeplus.eggItemsWithinPromotionPeriod = await page.evaluate((promoPeriod, today) => {
            const filteredItems = []; // 계란 데이터
            const allItems = []; // 전체 원본데이터 - 확인용

            // DOM요소를 가져와서 정보 추출
            document.querySelectorAll('.detailInfoWrap').forEach(item => {
                const title = item.querySelector('.css-ij8ita')?.textContent || ''; // 상품명
                const discountRate = item.querySelector('.discountRate')?.textContent || ''; // 할인율
                const price = item.querySelector('.priceValue')?.textContent || ''; // 가격
                const comment = item.querySelector('.recomComment')?.textContent || ''; // 코멘트

                // 원본 데이터를 저장
                allItems.push({ title, discountRate, price, comment });

                // 계란 관련 상품 필터링
                const eggKeywords = ['계란', '특란', '대란', '달걀', '행복대란', '신선란', '신선특란', '유기농란', '초특란'];
                const isEgg = new RegExp(eggKeywords.join('|')).test(title);

                // 조건 충족 시 데이터 추가
                if (isEgg) {
                    filteredItems.push({
                        title,
                        price,
                        discountRate,
                        comment,
                        promotionPeriod: promoPeriod,
                    });
                }
            });

            return { allItems, filteredItems };
        }, martData.homeplus.promotionPeriod, todayDate);

            // console.log("=== 원본 상품 데이터 ===");
            // console.log(martData.homeplus.eggItemsWithinPromotionPeriod.allItems);

            // console.log("=== 최종 필터링된 데이터 ===");
            // console.log(martData.homeplus.eggItemsWithinPromotionPeriod.filteredItems);

        await browser.close(); // 브라우저 닫기
    } catch (error) {
        console.error('홈플러스 데이터 불러오기 실패:', error);
        martData.homeplus.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    }
    return martData;
}

module.exports = { scrapeHomeplusData };