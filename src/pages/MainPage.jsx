import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { GAMES, GAME_MODES } from '../constants';
import { timeAgo } from '../utils';

const STATUS_LABEL = { PENDING: '대기중', APPROVED: '승인됨', CONFIRMED: '확정', REJECTED: '거절됨' };

export default function MainPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [searchType, setSearchType] = useState('title');
  const [keyword, setKeyword] = useState('');
  const [game, setGame] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async (kw = keyword) => {
    try {
      const { data } = await api.get('/posts', {
        params: { searchType, keyword: kw, game, gameMode, status },
      });
      setPosts(data);
    } catch { /* 무시 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType, keyword, game, gameMode, status]);

  useEffect(() => { load(); }, [game, gameMode, status]); // 필터 변경 시 즉시 재조회
  // eslint-disable-line react-hooks/exhaustive-deps

  const search = (e) => {
    e.preventDefault();
    load();
  };

  const apply = async (postId) => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/posts/${postId}/apply`);
      alert('참가 신청이 완료되었습니다!');
      load();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const writePost = () => {
    if (!user) { navigate('/login'); return; }
    navigate('/post/new');
  };

  const FilterChips = ({ options, value, onChange }) => (
    <>
      <button type="button" className={`chip ${value === '' ? 'on' : ''}`}
              onClick={() => onChange('')}>전체</button>
      {options.map((o) => (
        <button key={o.value ?? o} type="button"
                className={`chip ${value === (o.value ?? o) ? 'on' : ''}`}
                onClick={() => onChange(o.value ?? o)}>
          {o.label ?? o}
        </button>
      ))}
    </>
  );

  return (
    <div className="page">
      <div className="between" style={{ marginBottom: 14 }}>
        <p className="h2" style={{ margin: 0 }}>모집글</p>
        <button className="btn sm" onClick={writePost}>+ 모집글 작성</button>
      </div>

      {/* 검색 */}
      <form className="flex" style={{ marginBottom: 10 }} onSubmit={search}>
        <select className="inp" style={{ width: 100, margin: 0 }}
                value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="title">글제목</option>
          <option value="nickname">글쓴이</option>
        </select>
        <input className="inp" style={{ flex: 1, margin: 0 }} placeholder="검색어"
               value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button className="btn sm" type="submit" style={{ height: 38 }}>검색</button>
      </form>

      {/* 필터 */}
      <div className="row" style={{ marginBottom: 4 }}>
        <FilterChips options={GAMES} value={game} onChange={setGame} />
      </div>
      <div className="row" style={{ marginBottom: 4 }}>
        <FilterChips options={GAME_MODES} value={gameMode} onChange={setGameMode} />
      </div>
      <div className="row" style={{ marginBottom: 16 }}>
        <FilterChips options={[{ label: '모집중', value: 'RECRUITING' }, { label: '모집완료', value: 'CLOSED' }]}
                     value={status} onChange={setStatus} />
      </div>

      {posts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>
          조건에 맞는 모집글이 없습니다.
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="card">
          <div className="between" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div className="flex" style={{ minWidth: 0, flexWrap: 'wrap' }}>
              <span className={`dot ${post.author.online ? '' : 'off'}`}
                    title={post.author.online ? '방장 온라인' : '방장 오프라인'} />
              <span className="name" style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/post/${post.id}`)}>
                {post.title}
              </span>
              {post.game && <span className="tag">{post.game}</span>}
              {post.gameMode && <span className="tag">{post.gameMode}</span>}
              <span className="tag">{post.currentMembers}/{post.targetMembers}명</span>
              <span className="tag" style={post.status === 'RECRUITING'
                ? { background: '#e8f5ec', color: '#2b7a43' } : undefined}>
                {post.status === 'RECRUITING' ? '모집중' : '모집완료'}
              </span>
            </div>
            <div className="flex">
              <span className="meta">
                {post.author.nickname}
                {post.author.tier ? ` · ${post.author.tier}` : ''}
                {` · ${timeAgo(post.createdAt)}`}
              </span>
              {post.mine ? (
                <button className="btn2 sm" onClick={() => navigate(`/post/${post.id}`)}>
                  관리{post.pendingCount > 0 ? ` (신청 ${post.pendingCount})` : ''}
                </button>
              ) : post.myApplicationStatus ? (
                <span className="tag">{STATUS_LABEL[post.myApplicationStatus]}</span>
              ) : post.status === 'RECRUITING' ? (
                <button className="btn sm" onClick={() => apply(post.id)}>참가 신청</button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
