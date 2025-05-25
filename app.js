// 1. 필요한 모듈 불러오기
const express = require('express');
const path = require('path');
const session = require('express-session'); 
const mysql   = require('mysql2/promise');
const app = express();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com', // Office 365 SMTP 서버
  port: 465,                  // STARTTLS 포트
  secure: true,              // false → STARTTLS 사용
  auth: {
    user: 'younyenho@naver.com',      // 발송용으로 생성한 서비스 계정 이메일
    pass: 'WN8KC23E9R6V'
  }
});

// MySQL 풀 생성 (원하는 설정으로 호스트/계정/DB명 수정)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'daeho',
    password: '1234',
    database: 'user_db',
    waitForConnections: true,
    connectionLimit: 10
  });

// 세션 설정 (cookie 기반)
app.use(session({
  secret: 'YOUR_SECRET_KEY',    // 실제 배포 시에는 안전한 문자열로 바꿔주세요
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }     // https가 아니면 false
}));

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

app.get('/first-page', (req, res) => {
  res.render('firstpage');
});

app.get('/certification-stage', (req, res) => {
  const data = req.session.signupData;
  if (!data) {
    // 1단계(가입 폼)를 거치지 않고 바로 왔으면
    return res.redirect('/create_account');
  }
  res.render('certification-stage', { data });
});

app.get('/create_account', (req, res) => {
  res.render('create_account');
});

// 유저 상세 페이지 (GET)
 app.get('/users/:id', async (req, res, next) => {
     try {
       const userId = req.params.id;
       // 올바른 테이블명 user_profile, 올바른 PK 컬럼 user_id
       const [userRows] = await pool.query(
          `SELECT name, avatar_url, university, department, grade, age,
                  mbti, gender, meet_pref, study_goal,
                  vibe_pref, speaking_style, noise_sensitivity,
                  charm_point, strength
            FROM user_profile
            WHERE user_id = ?`, [userId]
        );
       if (!userRows[0]) return res.status(404).send('User not found');
       const user = userRows[0];
  
       // 2) 본인(로그인 유저) & 상세 페이지 유저 스케줄 조회
       const currentUserId = 1; // 세션에서 꺼내오는 예시
       const [mine]  = await pool.query(
         `SELECT day, hour FROM schedules WHERE user_id = ?`,
         [currentUserId]
       );
       const [other] = await pool.query(
         `SELECT day, hour FROM schedules WHERE user_id = ?`,
         [userId]
       );
  
       // 3) 공강 매칭 계산
       const mineSet  = new Set(mine.map(r => `${r.day}-${r.hour}`));
       const otherSet = new Set(other.map(r => `${r.day}-${r.hour}`));
       const matchSlots = [];
       for (let day = 1; day <= 5; day++) {
         for (let hour = 10; hour <= 18; hour++) {
           const key = `${day}-${hour}`;
           matchSlots.push({ day, hour, match: mineSet.has(key) && otherSet.has(key) });
         }
       }
  
       // 4) EJS 렌더링
       res.render('user-detail', { user, matchSlots });
     } catch (err) {
       next(err);
     }
   });

    // app.js
  app.get('/letters', async (req, res) => {
    const userId = req.session.userId || 1;
    const [rows] = await pool.query(`
      SELECT l.id, u.user_id AS senderId, u.name, u.avatar_url
      FROM letters l
      JOIN user_profile u ON u.user_id = l.sender_id
      WHERE l.receiver_id = ? AND l.status = 'pending'
      ORDER BY l.created_at DESC
    `, [userId]);
    res.render('letters-list', { letters: rows });
  });


  // ■ 편지 상세보기 라우트
  app.get('/letters/:letterId', async (req, res, next) => {
    try {
      const letterId = req.params.letterId;
      const [rows] = await pool.query(`
        SELECT l.*, u.name, u.avatar_url, u.kakao_id
        FROM letters l
        JOIN user_profile u
          ON u.user_id = l.sender_id
        WHERE l.id = ?
      `, [letterId]);
      if (!rows[0]) return res.status(404).send('No such letter');
      res.render('letters-detail', { letter: rows[0] });
    } catch (err) {
      next(err);
    }
  });

  app.post('/certification-stage', async (req, res) => {
    const {
      action,
      name, university, email, gender, department,
      code, password
    } = req.body;
  
    // 공통으로 넘겨줄 기본 로컬 변수
    const baseLocals = {
      data: req.session.signupData || { name, university, email, gender, department },
      codeVerified: false,
      signupComplete: false,
      mailSent: false,
      error: null
    };
  
    // 1) “인증번호 보내기” 클릭 (action=verify, 최초)
    if (action === 'verify' && !req.session.emailCode) {
      // a) 세션에 코드 저장
      const emailCode = String(100000 + Math.floor(Math.random() * 900000));
      req.session.emailCode = emailCode;
      req.session.signupData = { name, university, email, gender, department };
  
      // b) 메일 발송
      await transporter.sendMail({
        from:    `"GBC 인증" <${transporter.options.auth.user}>`,
        to:      email,
        subject: 'GBC 회원가입 인증번호',
        text:    `안녕하세요!\n인증번호는 ${emailCode} 입니다.`
      });
  
      return res.render('certification-stage', {
          ...baseLocals,
          // 기존 signupData에 code 세션 값을 추가
          data: {
            ...baseLocals.data,
            code: req.session.emailCode
          },
          mailSent: true
        });
    }
  
    // 2) “인증하기” 클릭 (action=verify, 세션에 emailCode 있음)
    if (action === 'verify' && req.session.emailCode) {
      if (code === req.session.emailCode) {
        // 검증 성공 → codeVerified=true
          return res.render('certification-stage', {
              ...baseLocals,
              data: {
                ...baseLocals.data,
                code: req.session.emailCode
              },
              mailSent: true,
              codeVerified: true
            });
      } else {
            // 검증 실패 → error 메시지, codeVerified는 false로
            return res.render('certification-stage', {
              ...baseLocals,
              data: {
                ...baseLocals.data,
                code: req.session.emailCode
              },
              mailSent: true,
              codeVerified: false,          // ← false로 변경
              error: '인증번호가 일치하지 않습니다.'
            });
      }
    }
  
    // 3) “회원가입 완료” 클릭 (action=complete)
    if (action === 'complete') {
      if (req.session.emailCode !== code) {
        // 코드 불일치
        return res.render('certification-stage', {
          ...baseLocals,
          mailSent: true,
          error: '인증번호가 일치하지 않습니다.'
        });
      }
      // 코드 일치 → DB 저장 후 signupComplete=true
      const hash = await bcrypt.hash(password, 10);
      await pool.execute(
        `INSERT INTO user_profile
           (name, university, email, password, gender, department)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, university, email, hash, gender, department]
      );
      return res.render('certification-stage', {
          ...baseLocals,
          data: {
            ...baseLocals.data,
            code: req.session.emailCode
          },
          codeVerified: true,
          signupComplete: true
        });
    }
  
    // 그 외 잘못된 접근은 다시 1단계로
    res.redirect('/create_account');
  });
    
    
  app.post('/login', async (req, res) => {
    try {
      // 1) 폼에서 넘어온 값 읽기
      const { 'login-email': email, 'login-password': password } = req.body;
  
      // 2) DB에서 해당 이메일의 해시된 비밀번호, 유저 아이디 조회
      const [rows] = await pool.query(
        `SELECT user_id, password
           FROM user_profile
          WHERE email = ?`,
        [email]
      );
  
      if (!rows[0]) {
        // 가입된 이메일이 아니면 에러 리턴
        return res.render('login', { error: '등록된 이메일이 아닙니다.' });
      }
  
      // 3) bcrypt로 비밀번호 비교
      const isMatch = await bcrypt.compare(password, rows[0].password);
      if (!isMatch) {
        // 비밀번호가 틀리면 에러 리턴
        return res.render('login', { error: '비밀번호가 일치하지 않습니다.' });
      }
  
      // 4) 세션에 로그인 상태 저장
      req.session.userId = rows[0].user_id;
  
      // 5) 로그인 성공 시 원하는 페이지로 리다이렉트
      return res.redirect('/timetable');
    } catch (err) {
      console.error(err);
      return res.status(500).render('login', { error: '서버 오류가 발생했습니다.' });
    }
  });
  
    // 유저 정보 저장 API (POST)
    app.post('/api/user-info', async (req, res) => {
      try {
        const {
          age, grade, kakaoId,
          smokingStatus, meetingPref,
          // … 나중에 mbti, gender 등도 추가 가능
        } = req.body;
    
        const sql = `
          INSERT INTO user_info
            (age, grade, kakao_id, smoking_status, meeting_pref)
          VALUES
            (?, ?, ?, ?, ?)
        `;
        const params = [age, grade, kakaoId, smokingStatus, meetingPref];
        const [result] = await pool.query(sql, params);
    
        res.json({ success: true, insertId: result.insertId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
      }
   });

  // ■ 편지 수락/거절 API
  app.post('/api/letters/:letterId/:action', async (req, res) => {
    try {
      const { letterId, action } = req.params;
      if (!['accept','reject'].includes(action)) {
        return res.status(400).json({ success:false, error:'INVALID_ACTION' });
      }
      const newStatus = action==='accept' ? 'accepted' : 'rejected';
      await pool.query(
        `UPDATE letters SET status = ? WHERE id = ?`,
        [newStatus, letterId]
      );
      res.json({ success:true, status:newStatus });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success:false, error:'SERVER_ERROR' });
    }
  });


// 4. 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});