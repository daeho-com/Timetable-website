document.addEventListener('DOMContentLoaded', () => {
    const listEl   = document.querySelector('.letter-list');
    const detailEl = document.querySelector('.letter-detail');
  
    // 목록 클릭 시 상세 로드
    listEl.addEventListener('click', async e => {
      const item = e.target.closest('.letter-item');
      if (!item) return;
      const id = item.dataset.id;
  
      // 1) 상세 HTML 가져오기
      const res  = await fetch(`/letters/${id}`);
      const html = await res.text();
      detailEl.innerHTML = html;
  
      // 2) 편지 아이콘 클릭으로 본문 보이기/숨기기
      const icon = detailEl.querySelector('.letter-icon');
      const content = detailEl.querySelector('.letter-content');
      icon.addEventListener('click', () => {
        content.classList.toggle('hidden');
      });
  
      // 수락·거절 버튼 이벤트
      detailEl.querySelector('.btn-accept')
        .addEventListener('click', () => handleAction(id, 'accept'));
      detailEl.querySelector('.btn-reject')
        .addEventListener('click', () => handleAction(id, 'reject'));
    });
  
    async function handleAction(id, action) {
      const res  = await fetch(`/api/letters/${id}/${action}`, { method:'POST' });
      const json = await res.json();
      if (!json.success) return alert('오류 발생');
    
      // 1) 목록에서 제거
      document.querySelector(`.letter-item[data-id="${id}"]`)?.remove();
    
      // 2) 상세영역에 커스텀 마크업 삽입
      if (action === 'accept') {
        detailEl.innerHTML = `
          <div class="result-accept">
            <p>🤝 수락되었습니다!</p>
            <button class="btn-back" onclick="location.href='/letters'">뒤로가기</button>
          </div>
        `;
      } else { // reject
        detailEl.innerHTML = `
          <div class="result-reject">
            <p>😔 거절되었습니다.</p>
            <button class="btn-back" onclick="location.href='/letters'">뒤로가기</button>
          </div>
        `;
      }
    }
  });