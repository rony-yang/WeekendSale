const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

const { scrapeHomeplusData } = require('./mart/homeplus');
const { scrapeHomeplusData } = require('./mart/emart');
const { scrapeHomeplusData } = require('./mart/lottemart');
const { scrapeHomeplusData } = require('./mart/hanaro');

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 홈플러스 데이터 제공 - API 라우트 등록
app.get('/api/homeplusData', async (req, res) => {
  try {
    const data = await scrapeHomeplusData();
    res.json(data.homeplus.eggItemsWithinPromotionPeriod);
  } catch (err) {
    console.error('API 에러:', err);
    res.status(500).json({ error: '데이터를 불러오는 중 문제가 발생했습니다.' });
  }
});

// 기본 페이지 라우트 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// 404 에러 처리
app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

// 서버 실행(라우트,미들웨어가 등록된 후 서버 시작)
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});