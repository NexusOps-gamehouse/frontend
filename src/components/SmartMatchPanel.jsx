import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MATCH_GAME_CONFIG, PLAY_STYLES, MIC_LEVELS, MEMBER_COUNTS, PLAY_TIMES } from '../constants';
import Chips, { MultiChips } from './Chips';
import { timeAgo } from '../utils';
import { searchMatch, recordMatchEvent, recordImpressions, matchErrMsg } from '../api/match';
const RECENT_KEY = 'gh_recent_match';
const MATCH_GAMES = Object.keys(MATCH_GAME_CONFIG);
const ANY_LABEL = '상관없음';
const styles = `
.smp-panel { position: relative; }
.smp-title { font-size: 13px; font-weight: 800; margin-bottom: 14px; }
.smp-blurb { font-size: 12.5px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; }
.smp-cta {
  width: 100%; padding: 14px; border: none; border-radius: var(--radius-md); cursor: pointer;
  background: linear-gradient(135deg, var(--primary), #1d4ed8); color: #fff; font-size: 15px; font-weight: 800;
  box-shadow: 0 8px 20px var(--primary-glow); display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: inherit;
}
.smp-cta:hover { filter: brightness(1.08); transform: translateY(-1px); }
.smp-recent { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
.smp-recent-title { font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; }
.smp-recent-meta { font-size: 11.5px; color: var(--text-muted); margin-bottom: 6px; }
.smp-recent-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12.5px; }
.smp-recent-row + .smp-recent-row { margin-top: 4px; }
.smp-recent-row-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.smp-recent-score { font-weight: 800; color: var(--primary); flex-shrink: 0; }
/* ---- 모달 ---- */
.smp-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
}
.smp-modal {
  width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto; background: var(--surface);
  border-radius: var(--radius-lg); box-shadow: 0 24px 60px rgba(0,0,0,.35); position: relative;
}
.smp-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; gap: 12px; }
.smp-modal-head h2 { font-size: 18px; font-weight: 800; margin: 0; }
.smp-modal-head .sub { font-size: 12.5px; color: var(--text-muted); margin-top: 3px; }
.smp-close {
  width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: transparent;
  font-size: 15px; cursor: pointer; color: var(--text-muted); flex-shrink: 0;
}
.smp-close:hover { border-color: var(--danger); color: var(--danger); }
.smp-modal-body { padding: 20px 24px 24px; }
.smp-field { margin-bottom: 18px; }
.smp-field label { display: block; font-size: 12.5px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.smp-field .hint { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-left: 6px; }
.smp-input {
  width: 100%; height: 42px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-color);
  padding: 0 14px; font-size: 13.5px; font-family: inherit; color: var(--text-main); outline: none;
}
.smp-input:focus { border-color: var(--primary); }
.smp-toggle2 { display: flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; width: fit-content; }
.smp-toggle2 button {
  padding: 9px 18px; border: none; background: var(--bg-color); font-size: 13px; font-weight: 700;
  color: var(--text-muted); cursor: pointer; font-family: inherit;
}
.smp-toggle2 button.sel { background: var(--primary); color: #fff; }
.smp-submit {
  width: 100%; padding: 15px; border: none; border-radius: var(--radius-md); cursor: pointer; margin-top: 6px;
  background: linear-gradient(135deg, var(--primary), #1d4ed8); color: #fff; font-size: 15px; font-weight: 800;
  font-family: inherit;
}
.smp-submit:hover:not(:disabled) { filter: brightness(1.08); }
.smp-submit:disabled { opacity: .6; cursor: not-allowed; }
/* ---- 결과 ---- */
.smp-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 12px; }
.smp-meta { font-size: 12px; color: var(--text-muted); }
.smp-relaxed { display: block; margin-top: 2px; color: var(--gold); font-weight: 600; }
.smp-refresh {
  display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: transparent;
  border-radius: 999px; padding: 7px 14px; font-size: 12px; font-weight: 700; color: var(--text-main); cursor: pointer;
  flex-shrink: 0; font-family: inherit;
}
.smp-refresh:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.smp-refresh:disabled { opacity: .6; cursor: default; }
.smp-refresh .ic { display: inline-block; transition: transform .5s; }
.smp-refresh.spin .ic { transform: rotate(360deg); }
.smp-rank1 {
  border: 1.5px solid var(--gold); background: linear-gradient(180deg, rgba(245,158,11,.06), transparent);
  border-radius: var(--radius-lg); padding: 18px; margin-bottom: 14px; position: relative;
}
.smp-rank1-badge {
  position: absolute; top: -11px; left: 16px; background: var(--gold); color: #fff; font-size: 11px; font-weight: 800;
  padding: 4px 12px; border-radius: 999px; box-shadow: 0 4px 10px var(--gold-glow);
}
.smp-rank1-top { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 6px; gap: 10px; }
.smp-rank1-title { font-size: 14.5px; font-weight: 800; cursor: pointer; }
.smp-rank1-title:hover { color: var(--primary); }
.smp-rank1-sub { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
/* 파티 구성 — "OO님의 파티"만 보여주던 자리에 실제로 누가 있는지 붙인다. */
.smp-party { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; align-items: center; }
.smp-party-chip {
  font-size: 11px; font-weight: 600; color: var(--text-main); background: var(--surface-hover);
  border-radius: 999px; padding: 3px 9px; white-space: nowrap;
}
.smp-party-chip.host { background: var(--gold); color: #fff; }
.smp-party-note { font-size: 11px; color: var(--text-muted); }
.smp-rank1-score { font-size: 22px; font-weight: 800; color: var(--primary); white-space: nowrap; }
.smp-rank1-score span { font-size: 11px; color: var(--text-muted); font-weight: 600; }
.smp-ai-box { margin-top: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
.smp-ai-tag {
  display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 800; color: #fff;
  background: var(--primary); border-radius: 999px; padding: 3px 9px; margin-bottom: 8px;
}
.smp-ai-headline { font-size: 13.5px; font-weight: 800; margin-bottom: 8px; line-height: 1.4; }
.smp-ai-reasons { list-style: none; padding: 0; margin: 0 0 8px; display: flex; flex-direction: column; gap: 5px; }
.smp-ai-reasons li { font-size: 12.5px; color: var(--text-main); display: flex; gap: 6px; line-height: 1.5; }
.smp-ai-reasons li::before { content: '✓'; color: var(--online); font-weight: 800; flex-shrink: 0; }
.smp-ai-caution { font-size: 12px; color: #92400e; background: rgba(245,158,11,.12); border-radius: 7px; padding: 8px 10px; display: flex; gap: 6px; line-height: 1.5; }
.smp-axis-list { margin-top: 12px; display: flex; flex-direction: column; gap: 7px; }
.smp-axis-row { display: grid; grid-template-columns: 76px 1fr 34px; align-items: center; gap: 8px; }
.smp-axis-name { font-size: 11px; color: var(--text-muted); font-weight: 600; }
.smp-axis-track { height: 6px; border-radius: 99px; background: var(--surface-hover); overflow: hidden; }
.smp-axis-fill { height: 100%; border-radius: 99px; background: var(--primary); }
.smp-axis-val { font-size: 11px; font-weight: 700; text-align: right; }
/* 재본 적 없는 축(설문·프로필 미입력) — 점수는 중립값이라 '안 맞는다'로 읽히면 안 된다. */
.smp-axis-row.unknown { opacity: .5; }
.smp-axis-row.unknown .smp-axis-fill { background: var(--text-muted); }
.smp-join-rank1 {
  width: 100%; margin-top: 14px; padding: 12px; border: none; border-radius: var(--radius-sm);
  background: var(--text-main); color: var(--surface); font-weight: 800; font-size: 13.5px; cursor: pointer; font-family: inherit;
}
.smp-join-rank1:hover:not(:disabled) { background: var(--primary); color: #fff; }
.smp-join-rank1:disabled { background: var(--online); color: #fff; cursor: default; }
.smp-row {
  display: flex; align-items: center; gap: 12px; padding: 11px 12px; border: 1px solid var(--border);
  border-radius: var(--radius-md); margin-bottom: 8px; background: var(--surface);
}
.smp-row-num {
  width: 26px; height: 26px; border-radius: 50%; background: var(--surface-hover); color: var(--text-muted);
  font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.smp-row-info { flex: 1; min-width: 0; cursor: pointer; }
.smp-row-title { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.smp-row-info:hover .smp-row-title { color: var(--primary); }
.smp-row-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.smp-row-score { font-size: 14px; font-weight: 800; color: var(--primary); width: 44px; text-align: right; flex-shrink: 0; }
.smp-join-small {
  border: 1px solid var(--border); background: transparent; color: var(--text-main); font-size: 11.5px; font-weight: 700;
  padding: 7px 11px; border-radius: 7px; cursor: pointer; flex-shrink: 0; font-family: inherit;
}
.smp-join-small:hover:not(:disabled) { background: var(--primary); border-color: var(--primary); color: #fff; }
.smp-join-small:disabled { background: var(--online); border-color: var(--online); color: #fff; cursor: default; }
.smp-empty { font-size: 13.5px; color: var(--text-muted); text-align: center; padding: 30px 10px; line-height: 1.6; }
.smp-toast {
  position: fixed; bottom: 28px; right: 28px; background: var(--text-main); color: var(--surface);
  padding: 14px 20px; border-radius: var(--radius-md); font-size: 13.5px; font-weight: 600;
  box-shadow: 0 10px 28px rgba(0,0,0,.3); display: flex; align-items: center; gap: 10px; z-index: 200;
}
.smp-toast .ok {
  width: 20px; height: 20px; border-radius: 50%; background: var(--online); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;
}
`;
/** localStorage에서 최근 매칭 요약 읽기. 없거나 깨졌으면 null. */
function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
/**
 * 파티에 실제로 누가 있는지 + 점수의 신뢰도.
 *
 * 서버는 원래도 파티원을 조회하고 있었지만(성향 점수를 가져오려면 id가 필요하다)
 * 응답에 싣지 않아서 화면은 "OO님의 파티"까지만 말할 수 있었다. 이제 party /
 * surveyedCount 가 내려온다.
 *
 * 설문 미응답자는 더 이상 점수를 깎지 않는 대신(그건 궁합 정보가 아니라 결측이다)
 * 여기서 "N명 중 M명 설문 완료"로 드러난다 — 점수를 얼마나 믿을지는 사용자가 판단한다.
 */
function PartyLine({ item }) {
  const party = item.party ?? [];
  if (party.length === 0) return null;

  const surveyed = item.surveyedCount ?? 0;
  return (
    <div className="smp-party">
      {party.map((m) => (
        <span key={m.userId} className={`smp-party-chip${m.host ? ' host' : ''}`}>
          {m.host ? '👑 ' : ''}{m.nickname ?? '알 수 없음'}{m.age ? ` · ${m.age}세` : ''}
        </span>
      ))}
      {surveyed < party.length && (
        <span className="smp-party-note">{party.length}명 중 {surveyed}명 성향 설문 완료</span>
      )}
    </div>
  );
}

export default function SmartMatchPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'results'
  const [recent, setRecent] = useState(loadRecent);
  // 검색 조건 — post/new와 같은 구조: 게임 선택 → 게임별 조건부 하위 질문
  const [game, setGame] = useState(MATCH_GAMES[0]);
  const cfg = MATCH_GAME_CONFIG[game];
  const [gameMode, setGameMode] = useState('');
  const [positions, setPositions] = useState([]);
  const [tier, setTier] = useState(''); // ''=상관없음
  // 시간대는 자유 입력이 아니라 프로필과 같은 어휘(아침/낮/저녁/새벽)로 받는다.
  // 자유 텍스트("오늘 21시")는 서버가 프로필의 playTimes와 비교할 방법이 없어
  // 저장도 안 되고 점수에도 못 쓰이는 값이었다. 비우면 프로필 값을 그대로 쓴다.
  const [playTimes, setPlayTimes] = useState([]);
  const [playStyle, setPlayStyle] = useState(''); // ''=상관없음. 고르면 그 텐션의 방만 남는 Hard Filter
  const [micLevel, setMicLevel] = useState('ANY');
  const [sizes, setSizes] = useState([]);
  /** 게임을 바꾸면 게임별 옵션이 통째로 달라지니, 그 게임에 종속된 선택값은 초기화한다. */
  const changeGame = (g) => {
    setGame(g);
    setGameMode('');
    setPositions([]);
    setTier('');
  };
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [result, setResult] = useState(null); // MatchSearchResponse
  const [meta, setMeta] = useState(null); // { gameLabel, gameModeLabel, sizeLabel }
  const [appliedIds, setAppliedIds] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const openModal = () => {
    if (!user) { navigate('/login'); return; }
    setStep('form');
    setSearchError('');
    setOpen(true);
  };
  const close = () => setOpen(false);
  const buildRequest = () => ({
    game,
    gameMode: gameMode || null,
    positions,
    tier: tier || null,
    micLevel,
    playStyle: playStyle || null,
    targetMembersOptions: sizes.map((n) => parseInt(n, 10)),
    playTime: playTimes.join(',') || null,
    limit: 5,
  });
  const submit = async (e) => {
    e.preventDefault();
    setSearchError('');
    setSearching(true);
    try {
      const req = buildRequest();
      const data = await searchMatch(req);
      applyResult(req, data);
      setStep('results');
    } catch (err) {
      setSearchError(matchErrMsg(err));
    } finally {
      setSearching(false);
    }
  };
  const applyResult = (req, data) => {
    setResult(data);
    setAppliedIds(new Set());
    setMeta({
      gameLabel: req.game,
      gameModeLabel: req.gameMode || ANY_LABEL,
      sizeLabel: req.targetMembersOptions.length ? `${req.targetMembersOptions.join('/')}명` : '인원무관',
    });
    if (data.results.length > 0) {
      recordImpressions(data.results.map((r) => r.resultId));
      // 최근 매칭 결과 위젯에 1위 점수 한 줄만 보여주던 걸 top 3(제목+점수)까지 보여주도록 확장.
      const topThree = data.results.slice(0, 3).map((r) => ({ title: r.title, score: Math.round(r.score) }));
      const nextRecent = { gameLabel: req.game, results: topThree, at: new Date().toISOString() };
      setRecent(nextRecent);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent)); } catch { /* 무시 */ }
    }
  };
  const refresh = async () => {
    if (!result) return;
    setRefreshing(true);
    try {
      const req = buildRequest();
      const data = await searchMatch(req);
      applyResult(req, data);
    } catch (err) {
      setSearchError(matchErrMsg(err));
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };
  const goToPost = (item) => {
    recordMatchEvent(item.resultId, 'CLICK');
    setOpen(false);
    navigate(`/post/${item.postId}`);
  };
  const apply = async (item) => {
    if (appliedIds.has(item.resultId)) return;
    try {
      await api.post(`/posts/${item.postId}/apply`);
      setAppliedIds((prev) => new Set(prev).add(item.resultId));
      recordMatchEvent(item.resultId, 'APPLY');
      setToast('참여 신청이 완료되었습니다.');
    } catch (err) {
      alert(errMsg(err));
    }
  };
  const calculatedAtText = result?.calculatedAt
    ? `${new Date(result.calculatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 기준 계산됨`
    : '';
  return (
    <aside className="smp-panel">
      <style>{styles}</style>
      <div className="smp-title">스마트 매칭</div>
      <p className="smp-blurb">포지션·티어·플레이 성향을 반영해 지금 나에게 가장 잘 맞는 파티 Top 5를 찾아드려요.</p>
      <button type="button" className="smp-cta" onClick={openModal}>⚡ 매칭하기</button>
      {recent && (
        <div className="smp-recent">
          <div className="smp-recent-title">최근 매칭 결과</div>
          <div className="smp-recent-meta">{timeAgo(recent.at)} · {recent.gameLabel}</div>
          {/* recent.results가 없으면(예전 형식으로 저장된 localStorage) recent.score 한 줄로 대체 표시 */}
          {(recent.results ?? (recent.score != null ? [{ score: recent.score }] : [])).map((r, i) => (
            <div className="smp-recent-row" key={i}>
              <span className="smp-recent-row-title">{r.title || `${i + 1}위`}</span>
              <span className="smp-recent-score">{r.score}점</span>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className="smp-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="smp-modal">
            {step === 'form' ? (
              <>
                <div className="smp-modal-head">
                  <div>
                    <h2>어떤 파티를 찾고 있나요?</h2>
                    <div className="sub">조건을 선택하면 딱 맞는 Top 5 파티를 추천해드려요</div>
                  </div>
                  <button type="button" className="smp-close" onClick={close}>✕</button>
                </div>
                <form className="smp-modal-body" onSubmit={submit}>
                  <div className="smp-field">
                    <label>어떤 게임을 하나요?</label>
                    <select className="smp-input" value={game} onChange={(e) => changeGame(e.target.value)}>
                      {MATCH_GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="smp-field">
                    <label>어떤 게임 모드를 원하시나요?</label>
                    <select className="smp-input" value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                      <option value="">{ANY_LABEL}</option>
                      {cfg.gameModes.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="smp-field">
                    <label>
                      어떤 {cfg.positionLabel}(으)로 참여하고 싶으신가요?
                      <span className="hint">내가 맡을 자리예요. 복수 선택 가능, 비우면 무관</span>
                    </label>
                    <MultiChips options={cfg.positions} values={positions} onChange={setPositions} />
                  </div>
                  <div className="smp-field">
                    <label>어느 정도의 티어를 원하시나요?</label>
                    <select className="smp-input" value={tier} onChange={(e) => setTier(e.target.value)}>
                      <option value="">{ANY_LABEL}</option>
                      {cfg.tiers.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="smp-field">
                    <label>어떤 플레이 스타일을 원하시나요? <span className="hint">다른 스타일은 빼드려요. 비우면 무관.</span></label>
                    <Chips options={PLAY_STYLES} value={playStyle} onChange={setPlayStyle} />
                  </div>
                  <div className="smp-field">
                    <label>요구하는 음성 채팅 정도는요?</label>
                    <div className="smp-toggle2">
                      {MIC_LEVELS.map((m) => (
                        <button key={m.code} type="button" className={micLevel === m.code ? 'sel' : ''}
                                onClick={() => setMicLevel(m.code)}>{m.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="smp-field">
                    <label>주로 언제 하시나요? <span className="hint">복수 선택 가능, 비우면 프로필에 저장된 시간대를 써요</span></label>
                    <MultiChips options={PLAY_TIMES} values={playTimes} onChange={setPlayTimes} />
                  </div>
                  <div className="smp-field">
                    <label>희망 파티원 수 (본인 포함) <span className="hint">복수 선택 가능, 비우면 무관</span></label>
                    <MultiChips options={MEMBER_COUNTS.map((n) => `${n}명`)} values={sizes} onChange={setSizes} />
                  </div>
                  {searchError && <div className="smp-empty" style={{ color: 'var(--danger)', padding: '0 0 12px' }}>{searchError}</div>}
                  <button type="submit" className="smp-submit" disabled={searching}>
                    {searching ? '찾는 중...' : '매칭하기'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="smp-modal-head">
                  <div>
                    <h2>Top 5 추천 파티</h2>
                    <div className="sub">{meta?.gameLabel} · {meta?.gameModeLabel} · {meta?.sizeLabel}</div>
                  </div>
                  <button type="button" className="smp-close" onClick={close}>✕</button>
                </div>
                <div className="smp-modal-body">
                  <div className="smp-toolbar">
                    <span className="smp-meta">
                      {calculatedAtText}
                      {result?.relaxed && <span className="smp-relaxed">조건에 맞는 방이 적어 마이크 조건은 완화해서 찾았어요</span>}
                    </span>
                    <button type="button" className={`smp-refresh ${refreshing ? 'spin' : ''}`}
                            onClick={refresh} disabled={refreshing}>
                      <span className="ic">↻</span> 새로고침
                    </button>
                  </div>
                  {result && result.results.length === 0 ? (
                    <div className="smp-empty">{result.topExplanation?.headline || '지금 조건에 맞는 모집글이 없어요.'}</div>
                  ) : (
                    <>
                      {result?.results[0] && (
                        <div className="smp-rank1">
                          <span className="smp-rank1-badge">🏆 1위 · 최적의 매칭</span>
                          <div className="smp-rank1-top">
                            <div>
                              <div className="smp-rank1-title" onClick={() => goToPost(result.results[0])}>
                                {result.results[0].title}
                              </div>
                              <div className="smp-rank1-sub">{result.results[0].authorNickname} 님의 파티</div>
                              <PartyLine item={result.results[0]} />
                            </div>
                            <div className="smp-rank1-score">{Math.round(result.results[0].score)}<span>점</span></div>
                          </div>
                          {result.topExplanation && (
                            <div className="smp-ai-box">
                              <span className="smp-ai-tag">✨ AI 매칭 설명</span>
                              <div className="smp-ai-headline">{result.topExplanation.headline}</div>
                              {result.topExplanation.reasons?.length > 0 && (
                                <ul className="smp-ai-reasons">
                                  {result.topExplanation.reasons.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              )}
                              {result.topExplanation.caution && (
                                <div className="smp-ai-caution">⚠️ {result.topExplanation.caution}</div>
                              )}
                            </div>
                          )}
                          <div className="smp-axis-list">
                            {result.results[0].axes.map((a) => (
                              <div className={`smp-axis-row${a.known === false ? ' unknown' : ''}`} key={a.axis}
                                   title={a.known === false ? '아직 정보가 없어 중립값으로 계산된 항목이에요' : undefined}>
                                <span className="smp-axis-name">{a.axis}</span>
                                <div className="smp-axis-track">
                                  <div className="smp-axis-fill" style={{ width: `${Math.round(a.score)}%` }} />
                                </div>
                                <span className="smp-axis-val">{a.known === false ? '—' : Math.round(a.score)}</span>
                              </div>
                            ))}
                          </div>
                          <button type="button" className="smp-join-rank1"
                                  disabled={appliedIds.has(result.results[0].resultId)}
                                  onClick={() => apply(result.results[0])}>
                            {appliedIds.has(result.results[0].resultId) ? '신청완료' : '이 파티방 참여하기'}
                          </button>
                        </div>
                      )}
                      {result?.results.slice(1).map((item) => (
                        <div className="smp-row" key={item.resultId}>
                          <div className="smp-row-num">{item.rank}</div>
                          <div className="smp-row-info" onClick={() => goToPost(item)}>
                            <div className="smp-row-title">{item.title}</div>
                            <div className="smp-row-sub">{item.authorNickname} 님의 파티</div>
                          </div>
                          <div className="smp-row-score">{Math.round(item.score)}점</div>
                          <button type="button" className="smp-join-small"
                                  disabled={appliedIds.has(item.resultId)}
                                  onClick={() => apply(item)}>
                            {appliedIds.has(item.resultId) ? '신청완료' : '참여하기'}
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="smp-toast">
          <span className="ok">✓</span><span>{toast}</span>
        </div>
      )}
    </aside>
  );
}
