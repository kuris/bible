/* ============================================================
   성경아 놀자 - 성경 퀴즈 (quiz.js)
   문제는 실제 성경 본문에서 낱말 하나를 가려 그 자리에서 만듭니다.
   본문을 새로 쓰거나 바꾸지 않습니다.
   ============================================================ */
(function () {
  'use strict';

  var books = {}, quizzes = [], cur = 0, score = 0, answered = false;
  var TOTAL = 10;

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

  // 본문에서 가릴 만한 낱말 고르기 (조사·짧은 낱말 제외)
  function pickWord(text) {
    var words = text.split(/\s+/).filter(function (w) {
      var c = w.replace(/[^가-힣A-Za-z]/g, '');
      return c.length >= 2 && c.length <= 6;
    });
    if (!words.length) return null;
    return words[Math.floor(Math.random() * words.length)];
  }

  async function build() {
    var pool = shuffle(BibleRefs.QUIZ_POOL.slice());
    var out = [];
    for (var i = 0; i < pool.length && out.length < TOTAL; i++) {
      var p = BibleRefs.parse(pool[i]);
      var text = await BibleData.loadVerse('krv', p.code, p.chapter, p.verse);
      if (!text) continue;
      var word = pickWord(text);
      if (!word) continue;
      var clean = word.replace(/[^가-힣A-Za-z]/g, '');

      // 오답 보기: 다른 구절에서 가져온 실제 낱말
      var wrong = [];
      var guard = 0;
      while (wrong.length < 3 && guard++ < 40) {
        var q = BibleRefs.parse(pool[Math.floor(Math.random() * pool.length)]);
        var t2 = await BibleData.loadVerse('krv', q.code, q.chapter, q.verse);
        var w2 = t2 ? pickWord(t2) : null;
        if (!w2) continue;
        var c2 = w2.replace(/[^가-힣A-Za-z]/g, '');
        if (c2 && c2 !== clean && wrong.indexOf(c2) === -1) wrong.push(c2);
      }
      if (wrong.length < 3) continue;

      out.push({
        ref: pool[i], code: p.code, chapter: p.chapter, verse: p.verse,
        text: text, answer: clean,
        blanked: text.replace(word, '____'),
        options: shuffle([clean].concat(wrong))
      });
    }
    return out;
  }

  function render() {
    var host = document.getElementById('quiz-box');
    if (cur >= quizzes.length) return finish();
    var q = quizzes[cur];
    var b = books[q.code];

    host.innerHTML =
      '<div style="display:flex;justify-content:space-between;color:var(--muted);font-size:13px;margin-bottom:10px">' +
      '<span>' + (cur + 1) + ' / ' + quizzes.length + '</span><span>' + score + '점</span></div>' +
      '<p class="verse-ko" style="margin:0 0 6px">' + esc(q.blanked) + '</p>' +
      '<p style="margin:0 0 16px;font-size:13px;color:var(--key);font-weight:700">' + esc((b ? b.ko : q.code) + ' ' + q.chapter + ':' + q.verse) + '</p>' +
      '<div id="quiz-opts" style="display:grid;gap:8px">' +
      q.options.map(function (o) {
        return '<button type="button" class="btn" data-o="' + esc(o) + '" style="justify-content:flex-start">' + esc(o) + '</button>';
      }).join('') + '</div>' +
      '<div id="quiz-msg" style="margin-top:14px"></div>';

    answered = false;
    document.getElementById('quiz-opts').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-o]');
      if (!btn || answered) return;
      answered = true;
      var ok = btn.getAttribute('data-o') === q.answer;
      if (ok) score++;
      document.querySelectorAll('#quiz-opts [data-o]').forEach(function (x) {
        if (x.getAttribute('data-o') === q.answer) x.classList.add('btn-primary');
        x.disabled = true;
      });
      document.getElementById('quiz-msg').innerHTML =
        '<p style="margin:0 0 8px;font-weight:700;color:' + (ok ? 'var(--accent)' : '#c0554a') + '">' +
        (ok ? '정답입니다' : '정답은 “' + esc(q.answer) + '” 입니다') + '</p>' +
        '<p class="verse-ko" style="margin:0 0 12px">' + esc(q.text) + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-primary btn-sm" id="quiz-next">다음 문제 →</button>' +
        '<a class="btn btn-sm" href="read.html?b=' + q.code.toLowerCase() + '&c=' + q.chapter + '&v=' + q.verse + '">→ 이 장으로</a></div>';
      document.getElementById('quiz-next').addEventListener('click', function () { cur++; render(); });
    });
  }

  async function finish() {
    var host = document.getElementById('quiz-box');
    if (window.BibleSync) await BibleSync.saveQuiz(score, quizzes.length, { type: 'verse-fill' });
    host.innerHTML =
      '<div style="text-align:center;padding:18px 0">' +
      '<div style="font-size:34px">🎯</div>' +
      '<h2 class="sec-title" style="margin:8px 0">' + quizzes.length + '문제 중 ' + score + '문제 정답</h2>' +
      '<p style="color:var(--muted);margin:0 0 16px">로그인하면 퀴즈 결과가 계정에 보관됩니다.</p>' +
      '<button type="button" class="btn btn-primary" id="quiz-again">다시 풀기</button></div>';
    document.getElementById('quiz-again').addEventListener('click', start);
  }

  async function start() {
    var host = document.getElementById('quiz-box');
    host.innerHTML = '<div class="loading">문제를 만드는 중…</div>';
    quizzes = await build(); cur = 0; score = 0;
    if (!quizzes.length) { host.innerHTML = '<div class="empty">문제를 만들지 못했습니다.</div>'; return; }
    render();
  }

  async function boot() {
    if (!window.BibleData || !window.BibleRefs) return;
    (await BibleData.books()).forEach(function (b) { books[b.code] = b; });
    start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
