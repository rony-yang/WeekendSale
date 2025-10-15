const puppeteer = require('puppeteer'); // 웹스크래핑과 자동화를 제공하는 도구. 헤드리스 모드 사용
const { eggKeywordsLottemart } = require('./EggKeywords');

// 이마트 데이터를 스크래핑하는 함수
async function scrapeLottemartData() {
    let martData = {
        lottemart: {
            eggItems: [], // HTML로 넘길 데이터
            error: null,
        },
    };

    // 계란으로 직접 검색
    const lottemartURL = 'https://lottemartzetta.com/products/search?q=%EA%B3%84%EB%9E%80';

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0); // 기본 네비게이션 타임아웃 해제

        // 웹 페이지로 이동
        await page.goto(lottemartURL);

        // 1초 동안 대기
        await new Promise(resolve => setTimeout(resolve, 1000)); // setTimeout이 1초뒤 완료되면 resolve가 호출(Promise 객체를 완료)

        // 데이터 스크래핑
        martData.lottemart.eggItems = await page.evaluate((eggKeywordsLottemart) => {
            const filteredItems = []; // 계란 데이터
            const allItems = []; // 전체 원본데이터 - 확인용

            // DOM요소를 가져와서 정보 추출
            document.querySelectorAll('[data-test="fop-body"]').forEach(item => {
                const title = item.querySelector('._text_cn5lb_1._text--m_cn5lb_23')?.textContent.trim() || ''; // 상품명
                const price = item.querySelector('._display_xy0eg_1.sc-cHMHOW.ldqIzW')?.textContent.trim() || ''; // 가격
                const comment = item.querySelector('._text--promotion_cn5lb_31')?.textContent.trim() || ''; // 코멘트
                // const discountRate = item.querySelector('')?.textContent || ''; // 할인율

                // 원본 데이터를 저장
                allItems.push({ title, price, comment });
                // allItems.push({ title, discountRate, price, comment });

                // 계란 관련 상품 필터링
                const isEgg = new RegExp(eggKeywordsLottemart.join('|')).test(title);
                console.log(isEgg);

                // 조건 충족 시 데이터 추가
                if (isEgg) {
                    // `filteredItems`에 중복된 `title`이 있을 경우 추가하지 않음
                    const alreadyExists = filteredItems.some(item => item.title === title);
                    if (!alreadyExists) {
                        filteredItems.push({ title, price, comment });
                    }
                }
            });

            return { allItems, filteredItems };
        }, eggKeywordsLottemart);

            // console.log("=== 원본 상품 데이터 ===");
            // console.log(martData.lottemart.eggItems.allItems);

            // console.log("=== 롯데마트 최종 필터링된 데이터 ===");
            // console.log(martData.lottemart.eggItems.filteredItems);

        await browser.close(); // 브라우저 닫기
    } catch (error) {
        console.error('롯데마트 데이터 불러오기 실패:', error);
        martData.lottemart.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    }
    return martData;
}

module.exports = { scrapeLottemartData };