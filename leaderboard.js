// Device-local leaderboard (scores persist in localStorage per browser).
// Each game saves its own score list, keyed by user ID.
// To get a global leaderboard, swap _db()/_write() with Firestore/Supabase calls.
class LeaderboardManager {
  constructor() { this._K = '_als2'; }

  // Save score for a game. Returns new rank (1-based) or null if not a personal best.
  save(game, score, meta = {}) {
    const u = window.auth?.user;
    const uid = u?.id || this._anon();
    const db = this._db();
    if (!db[game]) db[game] = [];
    const prev = db[game].findIndex(e => e.uid === uid);
    if (prev >= 0 && db[game][prev].score >= score) return this._rank(db[game], uid);
    const entry = { uid, name: u?.name || 'Anonymous', pic: u?.pic || '', score, meta, ts: Date.now() };
    if (prev >= 0) db[game].splice(prev, 1);
    db[game].push(entry);
    db[game].sort((a, b) => b.score - a.score);
    db[game] = db[game].slice(0, 100);
    this._write(db);
    return this._rank(db[game], uid);
  }

  top(game, n = 10) { return (this._db()[game] || []).slice(0, n); }

  myBest(game) {
    const uid = window.auth?.user?.id || this._anon();
    return (this._db()[game] || []).find(e => e.uid === uid) || null;
  }

  myRank(game) {
    const uid = window.auth?.user?.id || this._anon();
    return this._rank(this._db()[game] || [], uid);
  }

  games() { return Object.keys(this._db()); }

  _anon() {
    let id = localStorage.getItem('_ala');
    if (!id) { id = 'a' + Date.now().toString(36); localStorage.setItem('_ala', id); }
    return id;
  }
  _db() { try { return JSON.parse(localStorage.getItem(this._K)) || {}; } catch { return {}; } }
  _write(d) { localStorage.setItem(this._K, JSON.stringify(d)); }
  _rank(arr, uid) { const i = arr.findIndex(e => e.uid === uid); return i >= 0 ? i + 1 : null; }
}

window.lb = new LeaderboardManager();
