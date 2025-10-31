# 대형마트 계란 가격 정보 출력 사이트
nodejs 개인 프로젝트

**1. 개발 목표** : 대형마트 3사에서 오늘 날짜의 계란(30구) 가격 정보를 추출하여 출력해주는 사이트

**2. 메인 사진**
<img width="2880" height="2002" alt="Image" src="https://github.com/user-attachments/assets/8e7b1368-17d1-4aa0-8c85-1cd01653a149" />

**3. 작업기간** : 2025. 9월~10월

**4. 사용 기술**

- 언어 : javaScript(nodejs 기반)

- 웹 개발 기술 : HTML, CSS

- 서버 : express

- IDE : vs code, Github

- 데이터 수집 : ScrapingBee(렌더링 기반 데이터 수집 API)

- 배포 플랫폼 : render

**5. 주요기능**

- 계란별 정보 출력 : 상품명, 가격, 할인율, 비고 정보를 바로 확인할 수 있으며, 다양한 정보를 일목요연하게 확인할 수 있도록 구성

- 마트별 계란 가격 정보 출력 : 대형마트 3사(홈플러스, 이마트, 롯데마트)별로 실시간 계란 30구 가격 정보를 검색하여 출력

- 계란 종류별로 가격 정렬 : 계란의 크기(대란/특란)를 기준으로 분류하고, 낮은 가격순으로 정렬된 정보를 제공하여 최저가 상품을 빠르게 확인 가능

- 경량화 사이트 : 정보 크롤링 시 프로그램을 설치하는 것이 아니라 외부 렌더링 API 서비스를 사용함으로써 빠른 응답 속도와 낮은 리소스 사용이 가능

- 로딩 타이머 표시 : 정보를 로딩할 때 진행 상황을 직관적으로 보여주는 타이머가 작동하며, 로딩이 완료되면 멘트가 변경됨으로써 사이트의 동작 상태를 명확히 이해 가능
  
- 직관적 화면 제공 : 상품 정보와 가격 데이터를 직관적으로 볼 수 있는 사용자 친화적 인터페이스를 제공하여 누구나 쉽게 사용 가능

**6. Advanced Feature**

- ScrapingBee API는 복잡한 클라이언트 사이드 렌더링과 동적 콘텐츠를 처리할 수 있도록 설계된 서비스로 js가 완전히 실행된 상태에서의 HTML 데이터를 렌더링하여 반환합니다.

- axios.get 메서드를 통해 ScrapingBee API 엔드포인트를 호출하고, 이 때 렌더링 옵션을 활성화하여 동적 js가 완전히 실행된 HTML 데이터를 반환받습니다.

- User-Agent에서 일반적인 웹 브라우저와 동일하게 보이도록 설정해, 서버가 봇/스크래핑 탐지를 회피할 수 있도록 도와줍니다.

```nodejs
// ScrapingBee API를 사용하여 JS 렌더링된 HTML을 가져오는 함수
const axios = require('axios');

async function fetchRenderedHTML(apiKey, url) {
  const API_URL = 'https://app.scrapingbee.com/api/v1';

  try {
    const { data: html } = await axios.get(API_URL, {
      params: {
        api_key: apiKey, // ScrapingBee API 키
        url: url, // 타겟 URL
        render_js: true, // JS 렌더링 여부 설정
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    console.log('HTML 데이터 가져오기 성공');
    return html;
  } catch (error) {
    console.error('HTML 데이터 가져오기 실패:', error.message);
    throw new Error('데이터를 가져오는 중 문제가 발생했습니다.');
  }
}
