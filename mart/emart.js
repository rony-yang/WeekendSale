const puppeteer = require('puppeteer'); // 웹스크래핑과 자동화를 제공하는 도구. 헤드리스 모드 사용
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
    const emartURL = 'https://emart.ssg.com/search.ssg?query=%EA%B3%84%EB%9E%80';

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0); // 기본 네비게이션 타임아웃 해제

        // 웹 페이지로 이동
        await page.goto(emartURL);

        // 1초 동안 대기
        await new Promise(resolve => setTimeout(resolve, 1000)); // setTimeout이 1초뒤 완료되면 resolve가 호출(Promise 객체를 완료)

        // 데이터 스크래핑
        martData.emart.eggItems = await page.evaluate((eggKeywordsEmart) => {
            const filteredItems = []; // 계란 데이터
            const allItems = []; // 전체 원본데이터 - 확인용

            // DOM요소를 가져와서 정보 추출
            document.querySelectorAll('.chakra-link.css-1umjy1n').forEach(item => {
                const title = item.querySelector('.css-1mrk1dy')?.textContent || ''; // 상품명
                const discountRate = item.querySelector('.css-1pvxl37.css-idkz9h')?.nextSibling?.textContent.trim() || ''; // 할인율
                const priceRaw = item?.querySelector('.css-1fdb1oo')?.textContent.trim() || ''; // 원본 값
                const price = priceRaw.replace('판매가격', '').trim(); // "판매가격" 제거 및 공백 제거
                const comment = item.querySelector('.css-8uhtka')?.textContent || ''; // 코멘트

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

            // console.log("=== 원본 상품 데이터 ===");
            // console.log(martData.emart.eggItems.allItems);

            // console.log("=== 최종 필터링된 데이터 ===");
            // console.log(martData.emart.eggItems.filteredItems);

        await browser.close(); // 브라우저 닫기
    } catch (error) {
        console.error('이마트 데이터 불러오기 실패:', error);
        martData.emart.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    }
    return martData;
}

module.exports = { scrapeEmartData };