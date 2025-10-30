const axios = require('axios');
const cheerio = require('cheerio');
const { eggKeywordsHomeplus } = require('./EggKeywords');

// ScrapingBee를 이용한 홈플러스 데이터 스크래핑
async function scrapeHomeplusData() {
  let martData = {
    homeplus: {
      eggItems: [],
      error: null,
    },
  };

  const homeplusURL =
    'https://mfront.homeplus.co.kr/search?entry=direct&keyword=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';

  try {
    const API_URL = 'https://app.scrapingbee.com/api/v1';

    // ScrapingBee로 JS 렌더링된 HTML 가져오기
    const { data: html } = await axios.get(API_URL, {
      params: {
        api_key: process.env.SCRAPINGBEE_KEY, // Render 환경변수에 등록
        url: homeplusURL,
        render_js: true, // JS 렌더링 결과 포함
        wait: 3000, // 3초 대기
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    // 응답 데이터 확인
    // console.log('=== ScrapingBee 응답 데이터 (HTML) ===');
    // console.log(html);

    // HTML 파싱
    const $ = cheerio.load(html);
    const filteredItems = [];
     const allItems = [];

    $('.detailInfoWrap').each((i, el) => {
      const title = $(el).find('.css-ij8ita').text().trim() || '';
      const discountRate = $(el).find('.discountRate').text().trim() || '';
      const priceData = $(el).find('.price .priceValue').text().trim().replace(/,/g, '') || '';
      const price = `${parseInt(priceData, 10).toLocaleString()}`;
      const comment = $(el).find('.recomComment').text().trim() || '';

      // 모든 데이터를 수집하여 allItems에 추가
      allItems.push({ title, discountRate, price, comment });

      // 계란 관련 상품만 필터링
      const isEgg = new RegExp(eggKeywordsHomeplus.join('|')).test(title);
      if (isEgg) filteredItems.push({ title, discountRate, price, comment });
    });

    martData.homeplus.eggItems = filteredItems;

    // console.log('=== 홈플러스 원본 데이터 ===');
    // console.log(allItems);

    console.log('=== 홈플러스 최종 필터링된 데이터 ===');
    console.log(filteredItems);
  } catch (error) {
    console.error('홈플러스 데이터 불러오기 실패:', error.message);
    martData.homeplus.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  }

  return martData;
}

module.exports = { scrapeHomeplusData };
