document.addEventListener('DOMContentLoaded', () => {
    const listEl   = document.querySelector('.letter-list');
    const detailEl = document.querySelector('.letter-detail');
  
    // 목록 클릭 시 상세 로드
    listEl.addEventListener('click', async e => {
      const item = e.target.closest('.letter-item');
      if (!item) return;
      const id = item.dataset.id;
      const res = await fetch(`/letters/${id}`);
      const html= await res.text();
      detailEl.innerHTML = html;
  
      // 수락·거절 버튼 이벤트
      detailEl.querySelector('.btn-accept')
        .addEventListener('click', () => handleAction(id, 'accept'));
      detailEl.querySelector('.btn-reject')
        .addEventListener('click', () => handleAction(id, 'reject'));
    });
  
    // 수락/거절 처리
    async function handleAction(id, action) {
      const res  = await fetch(`/api/letters/${id}/${action}`, { method:'POST' });
      const json = await res.json();
      if (!json.success) return alert('오류 발생');
      // 목록에서 제거
      document.querySelector(`.letter-item[data-id="${id}"]`)?.remove();
      // 상세영역 메시지
      detailEl.innerHTML = `<p class="placeholder">${action==='accept'?'수락되었습니다':'거절되었습니다'}</p>`;
    }
  });