import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import Chips, { MultiChips } from '../components/Chips';
import { GAMES, GAME_MODES, POSITIONS, MEMBER_COUNTS } from '../constants';
import { csv } from '../utils';

const ANY_POSITION = '포지션 상관없음';
const POST_POSITIONS = [ANY_POSITION, ...POSITIONS];

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
  const [game, setGame] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [playTime, setPlayTime] = useState('');
  const [micRequired, setMicRequired] = useState(null);
  const [positions, setPositions] = useState([]);
  const [targetMembers, setTargetMembers] = useState(null);
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
        setMicRequired(data.micRequired ?? null);
        setPositions(csv(data.positions));
        setTargetMembers(data.targetMembers ?? null);
      })
      .catch(() => navigate('/'));
  }, [id, editing, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (micRequired === null) { setError('마이크 여부를 선택해주세요.'); return; }
    if (targetMembers === null) { setError('희망 파티원 수를 선택해주세요.'); return; }
    setLoading(true);
    const body = {
      title, content, game, gameMode, playTime, micRequired,
      positions: positions.join(','), targetMembers,
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

  const changePositions = (next) => {
    if (!next.includes(ANY_POSITION)) {
      setPositions(next);
      return;
    }
    if (!positions.includes(ANY_POSITION)) {
      setPositions([ANY_POSITION]);
      return;
    }
    setPositions(next.filter((position) => position !== ANY_POSITION));
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

            <div className="pf-q">어떤 게임을 하나요?</div>
            <Chips options={GAMES} value={game} onChange={setGame} />
            

            <div className="pf-q">게임 모드</div>
            <Chips options={GAME_MODES} value={gameMode} onChange={setGameMode} />

            <div className="pf-q">같이 할 시간</div>
            <input className="inp" type="text" style={{ marginBottom: 0 }}
                   placeholder="예: 오늘 21시, 주말 저녁, 상시"
                   value={playTime} onChange={(e) => setPlayTime(e.target.value)} />

            <div className="pf-q">마이크 여부</div>
            <Chips options={['필수', '없어도 됨']}
                   value={micRequired === null ? '' : micRequired ? '필수' : '없어도 됨'}
                   onChange={(v) => setMicRequired(v === '' ? null : v === '필수')} />

            <div className="pf-q">
              찾는 포지션 <span className="opt">(복수 선택 가능)</span>
            </div>
            <MultiChips options={POST_POSITIONS} values={positions} onChange={changePositions} />


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