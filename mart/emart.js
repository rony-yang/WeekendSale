const { chromium } = require('playwright');
const { eggKeywordsEmart } = require('./EggKeywords');

// 이마트 데이터를 스크래핑하는 함수
async function scrapeEmartData() {
    let martData = {
        emart: {
            eggItems: [], // HTML로 넘길 데이터
            error: null,
        },
    };

    // 계란으로 직접 검색
    const emartURL = 'https://emart.ssg.com/search.ssg?query=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';
    let browser;

    try {
        // Playwright 크로미움 브라우저 실행
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0); // 기본 네비게이션 타임아웃 해제

        // 페이지 접속
        await page.goto(emartURL, { waitUntil: 'networkidle' });

        // JS 렌더링이 끝날 때까지 1초 대기 (추가 안정성)
        await page.waitForTimeout(1000);

        // Playwright의 evaluate로 페이지 내부에서 데이터 추출
        const result = await page.evaluate((eggKeywordsEmart) => {
            const filteredItems = []; // 계란 데이터
            const allItems = []; // 전체 원본데이터 - 확인용

            // DOM요소를 가져와서 정보 추출
            document.querySelectorAll('.chakra-link.css-1umjy1n').forEach(item => {
                const title = item.querySelector('.css-1mrk1dy')?.textContent || ''; // 상품명
                const discountRate = item.querySelector('.css-aywnvu')?.textContent.trim() || ''; // 할인율
                const priceRaw = item.querySelector('.css-1oiygnj')?.textContent.trim() || ''; // 원본 값
                const price = priceRaw.replace('판매가격', '').trim(); // "판매가격" 제거 및 공백 제거
                const comment = item.querySelector('.css-why9nc')?.textContent.trim() || ''; // 코멘트

                // 원본 데이터를 저장
                allItems.push({ title, discountRate, price, comment });

                // 계란 관련 상품 필터링
                const isEgg = new RegExp(eggKeywordsEmart.join('|')).test(title);
                // console.log(isEgg);

                // 조건 충족 시 데이터 추가
                if (isEgg) {
                    filteredItems.push({ title, discountRate, price, comment });
                }
            });

            return { allItems, filteredItems };
        }, eggKeywordsEmart);

        martData.emart.eggItems = result.filteredItems;
            // console.log("=== 원본 상품 데이터 ===");
            // console.log(result.allItems);

            console.log("=== 이마트 최종 필터링된 데이터 ===");
            console.log(result.filteredItems);

        await browser.close(); // 브라우저 닫기
    } catch (error) {
        console.error('이마트 데이터 불러오기 실패:', error);
        martData.emart.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

        // 예외 발생 시 브라우저 안전 종료
        if (browser) await browser.close();
    }
    return martData;
}

module.exports = { scrapeEmartData };