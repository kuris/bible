/* ============================================================
   성경아 놀자 - 내 기록 (my.js)
   비로그인이어도 이 기기에 저장된 기록은 그대로 보여 줍니다.
   ============================================================ */
(function () {
  'use strict';
  var books = {};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function name(code){ var b = books[String(code).toUpperCase()]; return b ? b.ko : code; }
  function ago(iso){ return (window.CGAuth && CGAuth.timeAgo) ? CGAuth.timeAgo(iso) : ''; }

  function card(title, inner, note) {
    return '<section class="card"><h2 class="sec-title" style="margin-top:0">' + title + '</h2>' +
           inner + (note ? '<p style="margin:12px 0 0;font-size:12px;color:var(--muted)">' + note + '</p>' : '') +
           '</section>';
  }

  function renderRead() {
    var host = document.getElementById('my-recent');
    var list = (window.BibleSync ? BibleSync.readList() : []).slice().reverse();
    var inner;
    if (!list.length) {
      inner = '<div class="empty">아직 읽음 표시한 장이 없어요. 성경 읽기에서 “이 장 읽음 표시”를 눌러 보세요.</div>';
    } else {
      inner = '<p style="margin:0 0 10px;color:var(--muted);font-size:14px">모두 ' + list.length + '장</p><div class="cg-rec-list">' +
        list.slice(0, 20).map(function (id) {
          var p = id.split('.');
          return '<a class="cg-rec-row" href="read.html?b=' + p[0] + '&c=' + p[1] + '">' +
                 '<span class="cg-rec-title">' + esc(name(p[0]) + ' ' + p[1] + '장') + '</span></a>';
        }).join('') + '</div>';
    }
    host.innerHTML = card('📖 읽은 장', inner);
  }

  function renderFav() {
    var host = document.getElementById('my-fav');
    var list = (window.BibleSync ? BibleSync.favList() : []);
    var inner;
    if (!list.length) {
      inner = '<div class="empty">아직 즐겨찾기한 구절이 없어요. 읽기·검색 화면의 ☆ 를 눌러 보세요.</div>';
    } else {
      inner = list.slice(0, 30).map(function (f) {
        return '<div class="verse"><div class="verse-body">' +
          '<div style="font-weight:800;color:var(--key);font-size:13px">' + esc(name(f.code) + ' ' + f.chapter + ':' + f.verse) + '</div>' +
          (f.ko ? '<div class="verse-ko">' + esc(f.ko) + '</div>' : '') +
          '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<a class="btn btn-sm" href="read.html?b=' + String(f.code).toLowerCase() + '&c=' + f.chapter + '&v=' + f.verse + '">→ 이 장으로</a>' +
          '<button type="button" class="btn btn-sm" data-del="' + esc(f.ref) + '">삭제</button>' +
          '</div></div></div>';
      }).join('');
    }
    host.innerHTML = card('⭐ 즐겨찾기 구절', inner);
    host.addEventListener('click', async function (e) {
      var b = e.target.closest('[data-del]'); if (!b) return;
      var p = b.getAttribute('data-del').split('.');
      await BibleSync.toggleFav({ code: p[0], chapter: Number(p[1]), verse: Number(p[2]) });
      renderFav();
    }, { once: true });
  }

  function renderNote() {
    var host = document.getElementById('my-note');
    var list = (window.BibleSync ? BibleSync.noteList() : []);
    var inner = list.length
      ? list.slice(0, 30).map(function (n) {
          return '<div class="verse"><div class="verse-body">' +
            '<div style="font-weight:800;color:var(--key);font-size:13px">' + esc(name(n.code) + ' ' + n.chapter + ':' + n.verse) + '</div>' +
            '<div class="verse-ko">📝 ' + esc(n.content) + '</div>' +
            '<div style="font-size:12px;color:var(--muted)">' + esc(ago(n.at)) + '</div>' +
            '<div style="margin-top:6px"><a class="btn btn-sm" href="read.html?b=' + String(n.code).toLowerCase() + '&c=' + n.chapter + '&v=' + n.verse + '">→ 이 장으로</a></div>' +
            '</div></div>';
        }).join('')
      : '<div class="empty">아직 메모가 없어요. 읽기 화면의 📝 를 눌러 남겨 보세요.</div>';
    host.innerHTML = card('📝 내 메모', inner, '메모는 나만 볼 수 있습니다.');
  }

  function renderAll() { renderRead(); renderFav(); renderNote(); }

  async function start() {
    if (!window.BibleData) return;
    (await BibleData.books()).forEach(function (b) { books[b.code] = b; });
    renderAll();
    if (window.BibleSync) BibleSync.onChange(renderAll);
    if (window.CGAuth) CGAuth.onChange(function () { renderAll(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
