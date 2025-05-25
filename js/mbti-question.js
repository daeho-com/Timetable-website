document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.mbti-cell');
    const saveBtn = document.querySelector('#save-btn');
  
    function updateButton() {
      // 하나라도 .selected가 붙었으면 활성
      const any = Array.from(cells).some(c => c.classList.contains('selected'));
      saveBtn.classList.toggle('active', any);
    }
  
    cells.forEach(cell => {
      cell.addEventListener('click', () => {

        // 이미 선택된 셀이 있고 내가 클릭한 셀은 그 셀이 아닐 때 클릭을 무시한다
        const prev = document.querySelector('.mbti-cell.selected');
        if (prev && prev !== cell) return;
        
        cell.classList.toggle('selected');
        updateButton();
      });
    });
  
    // 초기 상태 반영
    updateButton();
  
    // 계속 버튼 클릭 시 페이지 이동 (선택된 게 없으면 동작 안 함)
    saveBtn.addEventListener('click', () => {
      if (!saveBtn.classList.contains('active')) return;
      window.location.href = '/다음-라우트'; 
    });
  });
  