import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import Chips, { MultiChips } from '../components/Chips';
import {
  ANY, MEMBER_COUNTS, POST_GAMES, VOICE_LEVELS, PLAY_STYLE_OPTIONS,
  GAME_REQUIREMENT_FIELDS, gameLabel, gameCodeOf, withoutAny,
} from '../constants';
import { csv } from '../utils';

const styles = `
.pf .pf-narrow { max-width: 680px; margin: 0 auto; padding: 0 24px; }

.pf .pf-panel {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 40px 32px;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,.4);
}

.pf .pf-title { font-size: 26px; font-weight: 800; margin-bottom: 24px; color: var(--text-main); letter-spacing: -.5px; }
.pf .pf-q { font-size: 15px; font-weight: 700; margin: 32px 0 12px; color: var(--text-main); }
.pf .pf-q .opt { font-weight: 500; color: var(--text-muted); font-size: 13px; }

/* 입력 (전역 .inp 덮어쓰기, 이 페이지 한정) */
.pf .inp {
  width: 100%; height: auto; padding: 16px 20px; border-radius: var(--radius-md);
  background: rgba(148,163,184,.08); border: 1px solid var(--border);
  color: var(--text-main); font-size: 15px; margin-bottom: 16px; font-family: inherit;
}
.pf .inp::placeholder { color: var(--text-muted); }
.pf .inp:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary); }
.pf textarea.inp { height: 160px; resize: vertical; line-height: 1.6; padding-top: 16px; }

/* 칩 (전역 .chip 덮어쓰기, 이 페이지 한정) */
.pf .chip {
  padding: 10px 18px; border-radius: 30px; border: 1px solid var(--border);
  background: rgba(148,163,184,.06); color: var(--text-muted);
  font-size: 14px; font-weight: 600; transition: all .2s;
}
.pf .chip:hover { border-color: var(--primary); color: var(--text-main); }
.pf .chip.on {
  background: var(--primary); color: #fff; border-color: var(--primary);
  box-shadow: 0 4px 12px var(--primary-glow); font-weight: 700;
}
.pf .row { gap: 10px; margin-bottom: 0; }

/* 게임별 조건 묶음 — 게임을 고르면 나타난다 */
.pf .pf-gamebox {
  margin-top: 28px; padding: 20px 20px 24px;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: rgba(148,163,184,.05);
}
.pf .pf-gamebox .pf-q:first-of-type { margin-top: 8px; }
.pf .pf-gamebox-title { font-size: 14px; font-weight: 800; color: var(--text-main); }
.pf .pf-hint {
  margin-top: 16px; padding: 14px 16px; font-size: 13px; color: var(--text-muted);
  border: 1px dashed var(--border); border-radius: var(--radius-md);
}

/* 에러 박스 */
.pf .pf-error {
  font-size: 14px; color: var(--danger); font-weight: 600;
  margin-top: 16px; padding: 12px 16px; background: rgba(239,68,68,.1);
  border-radius: var(--radius-sm); border: 1px solid rgba(239,68,68,.2);
}

/* 하단 버튼 */
.pf .pf-btn-primary {
  height: 52px; border-radius: var(--radius-md); border: none; cursor: pointer;
  background: var(--primary); color: #fff; font-size: 16px; font-weight: 700;
  box-shadow: 0 4px 15px var(--primary-glow); transition: all .2s; font-family: inherit;
}
.pf .pf-btn-primary:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
.pf .pf-btn-primary:disabled { background: var(--border); color: var(--text-muted); box-shadow: none; cursor: not-allowed; }
.pf .pf-btn-secondary {
  height: 52px; border-radius: var(--radius-md); cursor: pointer; font-family: inherit;
  background: transparent; color: var(--text-main); border: 1px solid var(--border);
  font-size: 15px; font-weight: 700; transition: all .2s;
}
.pf .pf-btn-secondary:hover { border-color: var(--primary); color: var(--primary); }
`;

export default function PostFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // 있으면 수정 모드
  const editing = Boolean(id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [game, setGame] = useState('');            // GameCode ('LOL' | 'VALORANT')
  const [playTime, setPlayTime] = useState('');
  const [voiceChat, setVoiceChat] = useState('');  // VOICE_LEVELS 의 code
  const [targetMembers, setTargetMembers] = useState(null);

  // 게임별 조건 — 고른 게임에 따라 선택지가 통째로 바뀐다
  const [gameMode, setGameMode] = useState('');
  const [roles, setRoles] = useState([]);
  const [tier, setTier] = useState('');
  const [playStyle, setPlayStyle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/posts/${id}`)
      .then(({ data }) => {
        setTitle(data.title);
        setContent(data.content);
        setGame(data.game || '');
        setGameMode(data.gameMode || '');
        setPlayTime(data.playTime || '');
        setVoiceChat(data.voiceChat || 'ANY');
        setRoles(csv(data.roles));
        setTier(data.tier || '');
        setPlayStyle(data.playStyle || '');
        setTargetMembers(data.targetMembers ?? null);
      })
      .catch(() => navigate('/'));
  }, [id, editing, navigate]);

  /**
   * 게임을 바꾸면 게임별 조건을 비운다.
   *
   * 이게 없으면 롤에서 '정글'을 고른 뒤 발로란트로 바꿔도 '정글'이 그대로 남아
   * 저장 시점에 서버가 400 을 낸다. 화면에는 보이지도 않는 값 때문에 저장이
   * 막히는 셈이라, 사용자는 무엇이 잘못됐는지 알 수 없다.
   */
  // 고른 게임의 선택지. 게임을 안 골랐으면 빈 목록이라 아래 블록이 그려지지 않는다.
  const fields = GAME_REQUIREMENT_FIELDS[game] ?? { roleLabel: '포지션', roles: [], tiers: [], modes: [] };

  const changeGame = (code) => {
    if (code === game) return;
    setGame(code);
    setGameMode('');
    setRoles([]);
    setTier('');
    setPlayStyle('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!game) { setError('게임을 선택해주세요.'); return; }
    if (!voiceChat) { setError('음성채팅 정도를 선택해주세요.'); return; }
    if (targetMembers === null) { setError('희망 파티원 수를 선택해주세요.'); return; }
    setLoading(true);

    // '상관없음'은 보내지 않는다. 조건이 없다는 뜻인데 문자열로 남기면
    // 추천 쪽에서 "'상관없음'인 사람을 찾는다"로 읽힐 수 있다.
    const body = {
      title, content, game, playTime, voiceChat, targetMembers,
      gameMode: gameMode === ANY ? '' : gameMode,
      roles: withoutAny(roles).join(','),
      tier: tier === ANY ? '' : tier,
      playStyle: playStyle === ANY ? '' : playStyle,
    };
    try {
      if (editing) {
        await api.put(`/posts/${id}`, body);
        navigate(`/post/${id}`);
      } else {
        const { data } = await api.post('/posts', body);
        navigate(`/post/${data.id}`);
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page pf">
      <style>{styles}</style>
      <div className="pf-narrow">
        <div className="pf-panel">
          <div className="pf-title">{editing ? '모집글 수정' : '모집글 작성'}</div>

          <form onSubmit={submit}>
            <input className="inp" type="text"
                   placeholder="파티원들이 한눈에 알아볼 수 있는 제목을 적어주세요."
                   value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea className="inp"
                      placeholder="원하는 플레이 스타일, 분위기, 디스코드 사용 여부 등 상세한 내용을 적어주시면 파티원을 더 쉽게 구할 수 있어요!"
                      value={content} onChange={(e) => setContent(e.target.value)} required />

            <div className="pf-q">어떤 게임을 하나요? <span className="opt">(필수)</span></div>
            <Chips options={POST_GAMES.map((g) => g.label)}
                   value={gameLabel(game)}
                   onChange={(label) => changeGame(gameCodeOf(label))} />

            {/*
              게임을 고르기 전에는 조건 칸을 아예 그리지 않는다.
              롤 포지션과 발로란트 역할을 동시에 보여주면 무엇이 내 게임의
              선택지인지 알 수 없고, 잘못 고른 값은 저장할 때야 튕긴다.
            */}
            {!game && (
              <div className="pf-hint">게임을 먼저 고르면 그 게임의 조건을 물어볼게요.</div>
            )}

            {game && (
              <div className="pf-gamebox">
                <div className="pf-gamebox-title">{gameLabel(game)}</div>

                <div className="pf-q">
                  찾는 {fields.roleLabel} <span className="opt">(복수 선택 가능)</span>
                </div>
                <MultiChips options={fields.roles} values={roles} onChange={setRoles} exclusive={ANY} />

                <div className="pf-q">티어 <span className="opt">(찾는 사람의 현재 티어)</span></div>
                <Chips options={fields.tiers} value={tier} onChange={setTier} />

                <div className="pf-q">게임 모드</div>
                <Chips options={fields.modes} value={gameMode} onChange={setGameMode} />

                <div className="pf-q">플레이스타일</div>
                <Chips options={PLAY_STYLE_OPTIONS} value={playStyle} onChange={setPlayStyle} />
              </div>
            )}

            <div className="pf-q">같이 할 시간</div>
            <input className="inp" type="text" style={{ marginBottom: 0 }}
                   placeholder="예: 오늘 21시, 주말 저녁, 상시"
                   value={playTime} onChange={(e) => setPlayTime(e.target.value)} />

            <div className="pf-q">음성채팅 정도</div>
            <Chips options={VOICE_LEVELS.map((v) => v.label)}
                   value={VOICE_LEVELS.find((v) => v.code === voiceChat)?.label ?? ''}
                   onChange={(label) =>
                     setVoiceChat(VOICE_LEVELS.find((v) => v.label === label)?.code ?? '')} />


            <div className="pf-q">
              희망 파티원 수 <span className="opt">(본인 포함)</span>
            </div>
            <Chips options={MEMBER_COUNTS.map((n) => `${n}명`)}
                   value={targetMembers === null ? '' : `${targetMembers}명`}
                   onChange={(v) => setTargetMembers(v === '' ? null : parseInt(v, 10))} />

            {error && <div className="pf-error">{error}</div>}

            <div className="flex" style={{ marginTop: 40, gap: 12 }}>
              <button className="pf-btn-secondary" type="button" style={{ flex: 1 }}
                      onClick={() => navigate(-1)}>취소</button>
              <button className="pf-btn-primary" type="submit" style={{ flex: 2 }} disabled={loading}>
                {loading ? '저장 중...' : editing ? '수정 완료' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}