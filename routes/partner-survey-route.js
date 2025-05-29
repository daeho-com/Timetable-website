// route/partner-survey.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /partner-survey
router.get('/', async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');
    
        // 이미 응답했는지 불러오기
        const [rows] = await pool.query(
          `SELECT smoking_status, meet_pref, study_goal, vibe_pref,
                  speaking_style, noise_sensitivity
             FROM partner_survey
            WHERE user_id = ?`,
          [req.session.userId]
        );
        // 있으면 첫 행, 없으면 null
        const survey = rows[0] || null;
    
        res.render('partner-survey', { survey });
      } catch (err) {
        next(err);
      }
});


// ■ POST /partner-survey — 설문 저장
router.post('/', async (req, res, next) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');
  
      const {
        smoking_status,
        meet_pref,
        study_goal,
        vibe_pref,
        speaking_style,
        noise_sensitivity
      } = req.body;
  
      // Upsert: 이미 있으면 UPDATE, 없으면 INSERT
      await pool.query(
        `INSERT INTO partner_survey 
           (user_id, smoking_status, meet_pref,
            study_goal, vibe_pref,
            speaking_style, noise_sensitivity)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           smoking_status = VALUES(smoking_status),
           meet_pref       = VALUES(meet_pref),
           study_goal      = VALUES(study_goal),
           vibe_pref       = VALUES(vibe_pref),
           speaking_style  = VALUES(speaking_style),
           noise_sensitivity = VALUES(noise_sensitivity)`,
        [userId, smoking_status, meet_pref, study_goal, vibe_pref, speaking_style, noise_sensitivity]
      );
  
      res.redirect('/next-step'); // 완료 후 이동할 페이지로 수정!
    } catch (err) {
      next(err);
    }
  });

module.exports = router;