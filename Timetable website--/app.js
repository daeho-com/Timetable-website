// 1. 필요한 모듈 불러오기
const express = require('express');
const path = require('path');
const app = express();

// 2. 미들웨어 설정
app.use(express.urlencoded({ extended: true })); // form 데이터 파싱
app.use(express.json());                         // JSON 데이터 파싱
app.use(express.static('public'));               // public 폴더 정적 파일 제공

// 3. 기본 라우팅 (index.html 보여주기)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// 4. 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});