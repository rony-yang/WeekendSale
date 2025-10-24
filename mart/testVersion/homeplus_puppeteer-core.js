// puppeteer-core를 사용하는 방법

const puppeteer = require('puppeteer-core');
const { findChromePath } = require('./chromePath');
const executablePath = findChromePath();
const { eggKeywordsHomeplus } = require('../EggKeywords');

// 홈플러스 데이터를 스크래핑하는 함수
async function scrapeHomeplusData() {
    let martData = {
        homeplus: {
            eggItems: [], // HTML로 넘길 데이터
            error: null,
        },
    };

    // 계란으로 직접 검색
    const homeplusURL = 'https://mfront.homeplus.co.kr/search?entry=direct&keyword=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';

    try {
        const browser = await puppeteer.launch({ 
            executablePath: executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ],
            headless: 'new'
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0); // 기본 네비게이션 타임아웃 해제

        // 홈플러스 웹 페이지로 이동
        await page.goto(homeplusURL);

        // 1초 동안 대기
        await new Promise(resolve => setTimeout(resolve, 1000)); // setTimeout이 1초뒤 완료되면 resolve가 호출(Promise 객체를 완료)

        // 홈플러스 데이터 스크래핑
        martData.homeplus.eggItems = await page.evaluate((eggKeywordsHomeplus) => {
            const filteredItems = []; // 계란 데이터
            const allItems = []; // 전체 원본데이터 - 확인용

            // DOM요소를 가져와서 정보 추출
            document.querySelectorAll('.detailInfoWrap').forEach(item => {
                const title = item.querySelector('.css-ij8ita')?.textContent || ''; // 상품명
                const discountRate = item.querySelector('.discountRate')?.textContent || ''; // 할인율
                const priceElement = item.querySelector('.price'); // price 클래스 안의 값만을 가져오도록 수정
                const price = priceElement?.querySelector('.priceValue')?.textContent.trim() || ''; // 가격
                const comment = item.querySelector('.recomComment')?.textContent || ''; // 코멘트

                // 원본 데이터를 저장
                allItems.push({ title, discountRate, price, comment });

                // 계란 관련 상품 필터링
                const isEgg = new RegExp(eggKeywordsHomeplus.join('|')).test(title);
                // console.log(isEgg);

                // 조건 충족 시 데이터 추가
                if (isEgg) {
                    filteredItems.push({ title, discountRate, price, comment });
                }
            });

            return { allItems, filteredItems };
        }, eggKeywordsHomeplus);
        // }, martData.homeplus.promotionPeriod, todayDate, eggKeywords);

            // console.log("=== 원본 상품 데이터 ===");
            // console.log(martData.homeplus.eggItems.allItems);

            console.log("=== 최종 필터링된 데이터 ===");
            console.log(martData.homeplus.eggItems.filteredItems);

        await browser.close(); // 브라우저 닫기
    } catch (error) {
        console.error('홈플러스 데이터 불러오기 실패:', error);
        martData.homeplus.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    }
    return martData;
}

module.exports = { scrapeHomeplusData };