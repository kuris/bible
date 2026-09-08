/* ============================================================
   성경아 놀자 - 읽기 기록 저장 (bible-sync.js)

   [원칙]
     · 로그인은 선택입니다. 비로그인 사용자도 모든 기능을 그대로 씁니다.
     · 비로그인: 이 기기(localStorage)에 저장됩니다.
     · 로그인:   기기 기록과 계정 기록을 "합쳐서" 양쪽에 반영합니다. (덮어쓰지 않음)
     · 서버 저장이 실패해도 기기 저장은 그대로이므로 화면이 멈추지 않습니다.

   의존성: cg-auth.js (window.CGAuth)
   ============================================================ */

(function (global) {
  'use strict';

  var K = {
    read:   'bible_read_chapters',   // ["jhn.3", …]
    fav:    'bible_favorites',       // [{ref, code, chapter, verse, ko, en, at}]
    note:   'bible_notes',           // [{ref, code, chapter, verse, content, at}]
    memory: 'bible_memory',          // {ref: {status, count, at}}
    quiz:   'bible_quiz'             // [{score,total,at}]
  };

  function CG() { return global.CGAuth || null; }
  function loggedIn() { return !!(CG() && CG().isLoggedIn()); }
  function warn(m, e) { try { console.warn('[말씀 기록] ' + m, e && (e.message || e)); } catch (_) {} }

  function get(key, dflt) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? dflt : v; }
    catch (e) { return dflt; }
  }
  function set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    fire();
  }

  var listeners = [];
  function onChange(cb) { if (typeof cb === 'function') listeners.push(cb); }
  function fire() { listeners.forEach(function (cb) { try { cb(); } catch (e) {} }); }

  // ============================================================
  // 읽은 장
  // ============================================================
  function readList() { return get(K.read, []); }
  function isRead(code, ch) { return readList().indexOf(idOf(code, ch)) !== -1; }
  function idOf(code, ch) { return String(code).toLowerCase() + '.' + ch; }

  async function markRead(code, ch, on) {
    var list = readList();
    var id = idOf(code, ch);
    var i = list.indexOf(id);
    var turnOn = on === undefined ? (i === -1) : !!on;

    if (turnOn && i === -1) list.push(id);
    if (!turnOn && i !== -1) list.splice(i, 1);
    set(K.read, list);

    if (loggedIn()) {
      try {
        if (turnOn) {
          await CG().upsertRecord('bible_reading_progress', {
            book: String(code).toUpperCase(), chapter: Number(ch),
            version: 'krv', language: 'ko', status: 'read',
            read_at: new Date().toISOString()
          }, 'user_id,book,chapter');
        } else {
          await CG().deleteRecord('bible_reading_progress', {
            book: String(code).toUpperCase(), chapter: Number(ch)
          });
        }
      } catch (e) { warn('읽기 진도 저장 실패', e); }
    }
    return turnOn;
  }

  // ============================================================
  // 즐겨찾기
  // ============================================================
  function favList() { return get(K.fav, []); }
  function favRef(code, ch, v) { return String(code).toLowerCase() + '.' + ch + '.' + v; }
  function isFav(code, ch, v) {
    var r = favRef(code, ch, v);
    return favList().some(function (x) { return x.ref === r; });
  }

  async function toggleFav(item) {
    var r = favRef(item.code, item.chapter, item.verse);
    var list = favList();
    var i = -1;
    list.forEach(function (x, n) { if (x.ref === r) i = n; });
    var turnOn = i === -1;

    if (turnOn) {
      list.unshift({
        ref: r, code: String(item.code).toUpperCase(),
        chapter: Number(item.chapter), verse: Number(item.verse),
        ko: item.ko || '', en: item.en || '',
        bookName: item.bookName || '', at: new Date().toISOString()
      });
      if (list.length > 500) list.pop();
    } else {
      list.splice(i, 1);
    }
    set(K.fav, list);

    if (loggedIn()) {
      try {
        if (turnOn) {
          await CG().upsertRecord('bible_favorites', {
            verse_ref: r, book: String(item.code).toUpperCase(),
            chapter: Number(item.chapter), verse: Number(item.verse),
            version: 'krv'
          }, 'user_id,verse_ref');
        } else {
          await CG().deleteRecord('bible_favorites', { verse_ref: r });
        }
      } catch (e) { warn('즐겨찾기 저장 실패', e); }
    }
    return turnOn;
  }

  // ============================================================
  // 메모
  // ============================================================
  function noteList() { return get(K.note, []); }
  function noteOf(code, ch, v) {
    var r = favRef(code, ch, v);
    var hit = noteList().filter(function (x) { return x.ref === r; })[0];
    return hit ? hit.content : '';
  }

  async function saveNote(item, content) {
    var r = favRef(item.code, item.chapter, item.verse);
    var list = noteList().filter(function (x) { return x.ref !== r; });
    if (content && content.trim()) {
      list.unshift({
        ref: r, code: String(item.code).toUpperCase(),
        chapter: Number(item.chapter), verse: Number(item.verse),
        bookName: item.bookName || '',
        content: content.trim(), at: new Date().toISOString()
      });
    }
    set(K.note, list);

    if (loggedIn()) {
      try {
        if (content && content.trim()) {
          var rows = await CG().listRecords('bible_notes', { match: { verse_ref: r }, limit: 1 });
          if (rows && rows[0]) {
            await CG().getPublicDb().from('bible_notes')
              .update({ content: content.trim(), updated_at: new Date().toISOString() })
              .eq('id', rows[0].id);
          } else {
            await CG().saveRecord('bible_notes', {
              verse_ref: r, book: String(item.code).toUpperCase(),
              chapter: Number(item.chapter), verse: Number(item.verse),
              content: content.trim(), is_private: true
            });
          }
        } else {
          await CG().deleteRecord('bible_notes', { verse_ref: r });
        }
      } catch (e) { warn('메모 저장 실패', e); }
    }
  }

  // ============================================================
  // 암송 / 퀴즈
  // ============================================================
  function memoryAll() { return get(K.memory, {}); }
  async function markMemory(ref, status) {
    var all = memoryAll();
    var cur = all[ref] || { status: 'learning', count: 0 };
    cur.status = status || cur.status;
    cur.count = (cur.count || 0) + 1;
    cur.at = new Date().toISOString();
    all[ref] = cur;
    set(K.memory, all);

    if (loggedIn()) {
      try {
        var p = ref.split('.');
        await CG().upsertRecord('bible_memory_progress', {
          verse_ref: ref, book: (p[0] || '').toUpperCase(),
          chapter: Number(p[1]) || 0, verse: Number(p[2]) || 0,
          status: cur.status, review_count: cur.count,
          last_reviewed_at: cur.at
        }, 'user_id,verse_ref');
      } catch (e) { warn('암송 진행률 저장 실패', e); }
    }
  }

  async function saveQuiz(score, total, detail) {
    var list = get(K.quiz, []);
    list.unshift({ score: score, total: total, at: new Date().toISOString() });
    if (list.length > 50) list.pop();
    set(K.quiz, list);

    if (loggedIn()) {
      try {
        await CG().saveRecord('bible_quiz_logs', {
          quiz_type: 'verse-fill', score: score, total: total, result: detail || null
        });
      } catch (e) { warn('퀴즈 결과 저장 실패', e); }
    }
  }

  // ============================================================
  // 로그인 시 기기 ↔ 계정 병합
  // ============================================================
  var merged = false;
  async function mergeOnLogin() {
    if (!loggedIn() || merged) return;
    merged = true;
    try {
      // --- 읽은 장 ---
      var remoteRead = await CG().listRecords('bible_reading_progress', { orderBy: 'read_at', limit: 2000 });
      var local = readList();
      var have = {};
      local.forEach(function (id) { have[id] = true; });

      remoteRead.forEach(function (r) {
        var id = idOf(r.book, r.chapter);
        if (!have[id]) { local.push(id); have[id] = true; }
      });
      try { localStorage.setItem(K.read, JSON.stringify(local)); } catch (e) {}

      var remoteSet = {};
      remoteRead.forEach(function (r) { remoteSet[idOf(r.book, r.chapter)] = true; });
      for (var i = 0; i < local.length; i++) {
        if (remoteSet[local[i]]) continue;
        var p = local[i].split('.');
        await CG().upsertRecord('bible_reading_progress', {
          book: (p[0] || '').toUpperCase(), chapter: Number(p[1]) || 0,
          version: 'krv', language: 'ko', status: 'read'
        }, 'user_id,book,chapter');
      }

      // --- 즐겨찾기 ---
      var remoteFav = await CG().listRecords('bible_favorites', { orderBy: 'created_at', limit: 1000 });
      var favs = favList();
      var favHave = {};
      favs.forEach(function (x) { favHave[x.ref] = true; });
      remoteFav.forEach(function (r) {
        if (favHave[r.verse_ref]) return;
        var p = r.verse_ref.split('.');
        favs.push({
          ref: r.verse_ref, code: r.book, chapter: r.chapter, verse: r.verse,
          ko: '', en: '', bookName: '', at: r.created_at
        });
        favHave[r.verse_ref] = true;
      });
      try { localStorage.setItem(K.fav, JSON.stringify(favs)); } catch (e) {}

      var favRemote = {};
      remoteFav.forEach(function (r) { favRemote[r.verse_ref] = true; });
      for (var j = 0; j < favs.length; j++) {
        if (favRemote[favs[j].ref]) continue;
        await CG().upsertRecord('bible_favorites', {
          verse_ref: favs[j].ref, book: favs[j].code,
          chapter: favs[j].chapter, verse: favs[j].verse, version: 'krv'
        }, 'user_id,verse_ref');
      }

      // --- 메모 ---
      var remoteNote = await CG().listRecords('bible_notes', { orderBy: 'updated_at', limit: 500 });
      var notes = noteList();
      var noteHave = {};
      notes.forEach(function (x) { noteHave[x.ref] = true; });
      remoteNote.forEach(function (r) {
        if (noteHave[r.verse_ref]) return;
        notes.push({
          ref: r.verse_ref, code: r.book, chapter: r.chapter, verse: r.verse,
          bookName: '', content: r.content, at: r.updated_at || r.created_at
        });
      });
      try { localStorage.setItem(K.note, JSON.stringify(notes)); } catch (e) {}

      fire();
      if (CG().refreshPanels) CG().refreshPanels();
    } catch (e) {
      warn('기록 병합 실패', e);
    }
  }

  function start() {
    if (!CG()) return;
    CG().onChange(function (s) {
      if (s.isLoggedIn) mergeOnLogin();
      else merged = false;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  global.BibleSync = {
    readList: readList, isRead: isRead, markRead: markRead,
    favList: favList, isFav: isFav, toggleFav: toggleFav, favRef: favRef,
    noteList: noteList, noteOf: noteOf, saveNote: saveNote,
    memoryAll: memoryAll, markMemory: markMemory,
    saveQuiz: saveQuiz, quizList: function () { return get(K.quiz, []); },
    onChange: onChange, mergeOnLogin: mergeOnLogin
  };
})(typeof window !== 'undefined' ? window : this);
