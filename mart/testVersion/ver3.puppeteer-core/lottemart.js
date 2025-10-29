const puppeteer = require('puppeteer-core');
const { findChromePath } = require('./chromePath');
const executablePath = findChromePath();
const { eggKeywordsLottemart } = require('./EggKeywords');

async function scrapeLottemartData() {
    let martData = {
        lottemart: {
            eggItems: [],
            error: null,
        },
    };

    const lottemartURL = 'https://lottemartzetta.com/products/search?q=%EA%B3%84%EB%9E%80%2030%EA%B5%AC';

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
        page.setDefaultNavigationTimeout(0);

        // 초기 로드
        await page.goto(lottemartURL, { waitUntil: 'domcontentloaded' });

        // 살짝 스크롤로 최소한의 lazy-load 트리거 (많이 내릴 필요 없음)
        await page.evaluate(async () => {
            window.scrollBy(0, window.innerHeight * 0.8);
        });
        await new Promise(resolve => setTimeout(resolve, 800));

        // **핵심**: "유효한(빈 타이틀이 아닌) 아이템"이 10개 모일 때까지 대기(최대 타임아웃)
        const maxWaitMs = 3000; // 최대 3초 대기
        const start = Date.now();
        while (true) {
            const validCount = await page.$$eval('[data-test="fop-body"]', nodes => {
                let count = 0;
                for (const node of nodes) {
                    // 캐러셀 안이면 제외
                    if (node.closest('[data-test="shoppable-banner-carousel"]')) continue;
                    // 우선 data-test 셀렉터 사용해 title 찾기
                    const titleEl = node.querySelector('[data-test="fop-title"]') || node.querySelector('h3');
                    const imgEl = node.querySelector('img[data-test="lazy-load-image"]');
                    const alt = imgEl ? imgEl.getAttribute('alt') : '';
                    const titleText = (titleEl && titleEl.textContent && titleEl.textContent.trim()) ? titleEl.textContent.trim() : (alt || '').trim();
                    if (titleText) count++;
                    if (count >= 10) break;
                }
                return count;
            });

            if (validCount >= 10) break;
            if (Date.now() - start > maxWaitMs) break;
            // 조금 더 기다려보고 재시도
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 이제 안정된 상태에서 실제 데이터 수집 (최대 10개의 "유효 항목"만)
        martData.lottemart.eggItems = await page.evaluate((eggKeywordsLottemart) => {
            const filteredItems = [];
            const allItems = [];

            // NodeList -> 배열로 변환하여 순서 보장
            const nodes = Array.from(document.querySelectorAll('[data-test="fop-body"]'));

            for (const node of nodes) {
                // 캐러셀(배너) 영역 상품은 제외
                if (node.closest('[data-test="shoppable-banner-carousel"]')) continue;

                // 먼저 '공식' 셀렉터로 시도 (더 안정적)
                let title = (node.querySelector('[data-test="fop-title"]')?.textContent || '').trim();
                // 대체: h3, 링크 텍스트, img.alt 등
                if (!title) {
                    title = (node.querySelector('h3')?.textContent || '').trim();
                }
                if (!title) {
                    title = (node.querySelector('[data-test="fop-product-link"]')?.textContent || '').trim();
                }
                if (!title) {
                    title = (node.querySelector('img[data-test="lazy-load-image"]')?.getAttribute('alt') || '').trim();
                }

                // price도 안정적 셀렉터 사용
                let price = (node.querySelector('[data-test="fop-price"]')?.textContent || '').trim();
                // fallback: 특정 클래스(없으면 빈 문자열)
                if (!price) {
                    price = (node.querySelector('._display_xy0eg_1')?.textContent || '').trim();
                }

                // promotion/comment
                let comment = (node.querySelector('[data-test="fop-offer-text"]')?.textContent || '').trim();
                if (!comment) comment = (node.querySelector('._text--promotion_cn5lb_31')?.textContent || '').trim() || '';

                // skip empty titles (중요)
                if (!title) continue;

                // allItems에는 순서대로 유효 항목만 넣고, 10개까지만 수집
                allItems.push({ title, price, comment });
                if (allItems.length >= 10) break;

                // 계란 관련 상품 필터링
                const regex = new RegExp(
                    eggKeywordsLottemart
                        .filter(k => k) // 빈 문자열 제거
                        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // 특수문자 escape
                        .join('|'), 
                    'i' // 대소문자 무시
                );
                const isEgg = regex.test(title);
                // console.log(isEgg);

                // 조건 충족 시 데이터 추가
                if (isEgg) {
                    filteredItems.push({ title, price, comment });
                }
            }
            return { allItems, filteredItems };
        }, eggKeywordsLottemart);

        // console.log("=== 원본 상품 데이터 (최대 10개, 유효 항목만) ===");
        // console.log(martData.lottemart.eggItems.allItems);

        // console.log("=== 롯데마트 필터링된 데이터 ===");
        // console.log(martData.lottemart.eggItems.filteredItems);

        await browser.close();
    } catch (error) {
        console.error('롯데마트 데이터 불러오기 실패:', error);
        martData.lottemart.error = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    }

    return martData;
}

module.exports = { scrapeLottemartData };