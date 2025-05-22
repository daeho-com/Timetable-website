// 1. 필요한 모듈 불러오기
const express = require('express');
const path = require('path');
const app = express();

// 2. 미들웨어 설정
app.use(express.urlencoded({ extended: true })); // form 데이터 파싱
app.use(express.json());                         // JSON 데이터 파싱
app.use(express.static(path.join(__dirname, 'public')));  // public 폴더 정적 파일 제공
app.use(
  '/components',
    express.static(path.join(__dirname,'components'))
  ); // components 폴더 정적 파일 제공
// EJS 뷰 엔진 설정 추가
app.set('view engine', 'ejs'); // EJS 템플릿 엔진 사용
app.set('views', path.join(__dirname, 'views')); // views 폴더 설정

// 3. 기본 라우팅 (index.html 보여주기)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/timetable', (req, res) => {
  res.render('timetable');
});

app.get('/mbti', (req, res) => {
  res.render('mbti');
});

app.get('/input01', (req, res) => {
  res.render('age_grade_id');
});

// 4. 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});