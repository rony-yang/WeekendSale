const fs = require('fs');

/**
 * 다양한 환경(Windows, macOS, Linux, Docker)에서
 * 자동으로 Chrome/Chromium 실행 경로를 탐색하는 유틸.
 * puppeteer 대신 puppeteer-core을 사용하기 위해 필요
 */
function findChromePath() {
  // 1. 환경 변수 우선
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) {
    // console.log(`✅ Using Chrome from CHROMIUM_PATH: ${process.env.CHROMIUM_PATH}`);
    return process.env.CHROMIUM_PATH;
  }

  // 2. OS별 후보 경로
  const candidates = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',

    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/opt/homebrew/bin/google-chrome', // M1/M2 mac

    // Linux / Docker
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/usr/local/bin/chrome',
  ];

  // 3. 실제 존재하는 경로 찾기
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      // console.log(`✅ Found Chrome executable: ${candidate}`);
      return candidate;
    }
  }

  // 4. 실패 시 에러 안내
  throw new Error(`
❌ Chrome executable not found.
Please install Google Chrome or set CHROMIUM_PATH environment variable.

예시:
  macOS/Linux:
    export CHROMIUM_PATH="/usr/bin/google-chrome"
  Windows (PowerShell):
    $env:CHROMIUM_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  `);
}

// 5. 외부에서 import 가능하게 export
module.exports = { findChromePath };