// axios + cheerio 사용 버전 - 오류 수정 필요

const axios = require('axios'); // HTML 요청용 라이브러리
const cheerio = require('cheerio'); // HTML 파싱(분석) 라이브러리
const { eggKeywordsHomeplus } = require('../EggKeywords');

// 홈플러스 데이터를 스크래핑하는 함수
async function scrapeHomeplusData() {
  let martData = {
    homeplus: {
      eggItems: [], // HTML로 넘길 데이터
      error: null,
    },
  };

  // 홈플러스 검색
  const homeplusURL =
    'https://mfront.homeplus.co.kr/search?entry=direct&keyword=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';

  try {
    const { data: html } = await axios.get(homeplusURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    // cheerio로 HTML 파싱
    const $ = cheerio.load(html);

    const items = [];

  $('.detailInfoWrap').each((i, el) => {
    const $el = $(el);

    const title = $el.find('.css-ij8ita').text().trim() || '';  // 상품명
    const discountRate = $el.find('.discountRate').text().trim() || ''; // 할인율

    const $priceBlock = $el.find('.price'); // cheerio 객체 (요소)
    const price = $priceBlock.find('.priceValue').text().trim() || ''; // 가격 (하위 셀렉터에서 추출)

    const comment = $el.find('.recomComment').text().trim() || ''; 

    const isEgg = eggKeywordsHomeplus.some((kw) => title.includes(kw));
    if (isEgg) {
      items.push({ title, discountRate, price, comment });
    }

    });
console.log(items);
    martData.homeplus.eggItems = items;
    
  } catch (error) {
    console.error('홈플러스 데이터 불러오기 실패:', error.message);
    martData.homeplus.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  }

  return martData;
}

module.exports = { scrapeHomeplusData };
