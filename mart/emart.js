const axios = require('axios');
const cheerio = require('cheerio');
const { eggKeywordsEmart } = require('./EggKeywords');

// 이마트 데이터를 ScrapingBee로 스크래핑하는 함수
async function scrapeEmartData() {
  let martData = {
    emart: {
      eggItems: [],
      error: null,
    },
  };

  const emartURL = 'https://emart.ssg.com/search.ssg?query=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';

  try {
    const API_URL = 'https://app.scrapingbee.com/api/v1';

    // ScrapingBee API로 JS 렌더링된 HTML 가져오기
    const { data: html } = await axios.get(API_URL, {
      params: {
        api_key: process.env.SCRAPINGBEE_KEY, // Render 환경 변수
        url: emartURL,
        render_js: true, // JS 렌더링 결과 포함
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    // HTML 파싱
    const $ = cheerio.load(html);
    const filteredItems = [];

    $('.chakra-link.css-1umjy1n').each((i, el) => {
      const title = $(el).find('.css-1mrk1dy').text().trim() || ''; // 상품명
      const discountRate = $(el).find('.css-aywnvu').text().trim() || ''; // 할인율
      const priceRaw = $(el).find('.css-1oiygnj').text().trim() || '';
      const price = priceRaw
        .replace('판매가격', '') // "판매가격" 문자열 제거
        .trim()
        .replace(/,/g, '') // 기존 쉼표 제거
        .replace(/\d+/, (match) => Number(match).toLocaleString()); // 숫자 변환 후 포맷
      const comment = $(el).find('.css-why9nc').text().trim() || ''; // 코멘트

      // 계란 관련 상품만 필터링
      const isEgg = new RegExp(eggKeywordsEmart.join('|')).test(title);
      if (isEgg) {
        filteredItems.push({ title, discountRate, price, comment });
      }
    });

    martData.emart.eggItems = filteredItems;

    console.log('=== 이마트 최종 필터링된 데이터 ===');
    console.log(filteredItems);
  } catch (error) {
    console.error('이마트 데이터 불러오기 실패:', error.message);
    martData.emart.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  }

  return martData;
}

module.exports = { scrapeEmartData };
