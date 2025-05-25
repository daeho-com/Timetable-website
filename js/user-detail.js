// public/js/user-detail.js
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.querySelector('.btn-send');
    let hasSent = false;  // 전송 여부 플래그
  
    sendBtn.addEventListener('click', () => {
      if (!hasSent) {
        // 첫 클릭
        alert('성공적으로 보내졌습니다');
        hasSent = true;
        // 실제 전송 로직이 있다면 여기에 AJAX 호출 넣으세요.
      } else {
        // 이미 보낸 상태
        alert('이미 보낸 상대입니다');
      }
    });
  });