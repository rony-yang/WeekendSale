const axios = require('axios');
const cheerio = require('cheerio');
const { eggKeywordsLottemart } = require('./EggKeywords');

// 롯데마트 데이터를 ScrapingBee로 스크래핑하는 함수
async function scrapeLottemartData() {
  let martData = {
    lottemart: {
      eggItems: [],
      error: null,
    },
  };

  const lottemartURL = 'https://lottemartzetta.com/products/search?q=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';

  try {
    const API_URL = 'https://app.scrapingbee.com/api/v1';

    // ScrapingBee API 호출 (JS 렌더링 포함)
    const { data: html } = await axios.get(API_URL, {
      params: {
        api_key: process.env.SCRAPINGBEE_KEY,
        url: lottemartURL,
        render_js: true,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    // HTML 파싱
    const $ = cheerio.load(html);
    const filteredItems = [];

    // 최대 10개의 유효 항목만 처리
    const nodes = $('[data-test="fop-body"]').slice(0, 20); // 예비 항목 포함
    nodes.each((i, el) => {
      const node = $(el);

      // 캐러셀/배너 영역 제외
      if (node.closest('[data-test="shoppable-banner-carousel"]').length > 0) return;

      // 상품명 추출 (여러 fallback)
      let title = node.find('[data-test="fop-title"]').text().trim();
      if (!title) title = node.find('h3').text().trim();
      if (!title) title = node.find('[data-test="fop-product-link"]').text().trim();
      if (!title) title = node.find('img[data-test="lazy-load-image"]').attr('alt')?.trim() || '';

      if (!title) return; // 제목 없는 항목 건너뜀

      // 가격 추출
      let price = node.find('[data-test="fop-price"]').text().trim(); // 첫 번째 선택자로 값 찾기

      if (!price) {
        price = node.find('._display_xy0eg_1').text().trim() || ''; // 값 없을 경우 대체 선택자 검색
      }

      price = price
        .replace(/,/g, '') // 쉼표 제거
        .replace(/\d+/g, (match) => Number(match).toLocaleString()); // 숫자 포맷 및 "원" 추가

      // 코멘트
      let comments = node.find('[data-test="fop-offer-text"]') // 'fop-offer-text' 기준으로 데이터 찾기
        .map(function () {return $(this).text().trim();}).get(); // jQuery 객체를 배열로 변환

      if (comments.length === 0) { // 결과가 없는 경우 다른 대체 선택자로 한 번 더 찾기
        comments = node.find('._text--promotion_cn5lb_31')
          .map(function () {return $(this).text().trim();}).get();
      }

      // 코멘트를 쉼표로 결합
      const comment = comments.length > 0 ? comments.join(', ') : '';

      // 계란 관련 상품 필터링
      const regex = new RegExp(
        eggKeywordsLottemart
          .filter(k => k)
          .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|'),
        'i'
      );
      const isEgg = regex.test(title);
      if (isEgg) filteredItems.push({ title, price, comment });
    });

    martData.lottemart.eggItems = filteredItems;

    console.log('=== 롯데마트 필터링된 데이터 ===');
    console.log(filteredItems);
  } catch (error) {
    console.error('롯데마트 데이터 불러오기 실패:', error.message);
    martData.lottemart.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  }

  return martData;
}

module.exports = { scrapeLottemartData };
