import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import Chips, { MultiChips } from '../components/Chips';
import { GAMES, GAME_MODES, POSITIONS, MEMBER_COUNTS } from '../constants';
import { csv } from '../utils';

const ANY_POSITION = '포지션 상관없음';
const POST_POSITIONS = [ANY_POSITION, ...POSITIONS];

export default function PostFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // 있으면 수정 모드
  const editing = Boolean(id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [game, setGame] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [playTime, setPlayTime] = useState('');
  const [micRequired, setMicRequired] = useState(false);
  const [positions, setPositions] = useState([]);
  const [targetMembers, setTargetMembers] = useState(2);
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
        setMicRequired(data.micRequired || false);
        setPositions(csv(data.positions));
        setTargetMembers(data.targetMembers || 2);
      })
      .catch(() => navigate('/'));
  }, [id, editing, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
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
    <div className="page">
      <div className="center wide">
        <p className="h2">{editing ? '모집글 수정' : '모집글 작성'}</p>
        <form onSubmit={submit}>
          <input className="inp" type="text" placeholder="제목"
                 value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="inp" placeholder="내용"
                    value={content} onChange={(e) => setContent(e.target.value)} required />

          <p className="q" style={{ marginTop: 14 }}>어떤 게임을 하나요?</p>
          <Chips options={GAMES} value={game} onChange={setGame} />

          <p className="q">게임 모드</p>
          <Chips options={GAME_MODES} value={gameMode} onChange={setGameMode} />

          <p className="q">같이 할 시간</p>
          <input className="inp" type="text" placeholder="예: 오늘 21시, 주말 저녁"
                 value={playTime} onChange={(e) => setPlayTime(e.target.value)} />

          <p className="q">마이크</p>
          <div className="row">
            <button type="button" className={`chip ${micRequired ? 'on' : ''}`}
                    onClick={() => setMicRequired(true)}>필수</button>
            <button type="button" className={`chip ${!micRequired ? 'on' : ''}`}
                    onClick={() => setMicRequired(false)}>없어도 됨</button>
          </div>

          <p className="q">찾는 포지션 (복수 선택)</p>
          <MultiChips options={POST_POSITIONS} values={positions} onChange={changePositions} />

          <p className="q">희망 파티원 수 (본인 포함)</p>
          <div className="row">
            {MEMBER_COUNTS.map((n) => (
              <button key={n} type="button" className={`chip ${targetMembers === n ? 'on' : ''}`}
                      onClick={() => setTargetMembers(n)}>{n}명</button>
            ))}
          </div>

          {error && <p className="error-msg">{error}</p>}
          <div className="flex" style={{ marginTop: 12 }}>
            <button className="btn2" type="button" style={{ flex: 1 }}
                    onClick={() => navigate(-1)}>취소</button>
            <button className="btn" type="submit" style={{ flex: 2 }} disabled={loading}>
              {loading ? '저장 중...' : editing ? '수정 완료' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
