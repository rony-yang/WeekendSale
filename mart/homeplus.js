const { chromium } = require('playwright');
const { eggKeywordsHomeplus } = require('./EggKeywords');

// 홈플러스 데이터를 스크래핑하는 함수
async function scrapeHomeplusData() {
  let martData = {
    homeplus: {
      eggItems: [], // HTML로 넘길 데이터
      error: null,
    },
  };

  // 홈플러스 검색 URL
  const homeplusURL =
    'https://mfront.homeplus.co.kr/search?entry=direct&keyword=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';
  let browser;

  try {
    // Playwright 크로미움 브라우저 실행
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0); // 타임아웃 해제

    // 페이지 접속
    await page.goto(homeplusURL, { waitUntil: 'networkidle' });

    // JS 렌더링이 끝날 때까지 1초 대기 (추가 안정성)
    await page.waitForTimeout(1000);

    // Playwright의 evaluate로 페이지 내부에서 데이터 추출
    const result = await page.evaluate((eggKeywordsHomeplus) => {
      const filteredItems = []; // 계란 데이터
      const allItems = []; // 전체 원본 데이터 (디버그용)

      document.querySelectorAll('.detailInfoWrap').forEach((item) => {
        const title = item.querySelector('.css-ij8ita')?.textContent?.trim() || '';
        const discountRate = item.querySelector('.discountRate')?.textContent?.trim() || '';
        const price = item.querySelector('.price .priceValue')?.textContent?.trim().replace(/,/g, '') || '';
        const comment = item.querySelector('.recomComment')?.textContent?.trim() || '';

        allItems.push({ title, discountRate, price, comment });

        // 계란 관련 키워드 포함 여부 확인
        const isEgg = new RegExp(eggKeywordsHomeplus.join('|')).test(title);
        if (isEgg) filteredItems.push({ title, discountRate, price, comment });
      });

      return { allItems, filteredItems };
    }, eggKeywordsHomeplus);

    martData.homeplus.eggItems = result.filteredItems;

    // console.log('=== 홈플러스 최종 필터링된 데이터 ===');
    // console.log(result.allItems);

    // console.log('=== 홈플러스 최종 필터링된 데이터 ===');
    // console.log(result.filteredItems);

    await browser.close(); // 브라우저 닫기
  } catch (error) {
    console.error('홈플러스 데이터 불러오기 실패:', error);
    martData.homeplus.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

    // 예외 발생 시 브라우저 안전 종료
    if (browser) await browser.close();
  }

  return martData;
}

module.exports = { scrapeHomeplusData };
