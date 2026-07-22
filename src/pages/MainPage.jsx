import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { GAMES, GAME_MODES } from '../constants';
import { timeAgo } from '../utils';
import './MainPage.css';

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

  // 좌측 사이드바 필터 버튼 그룹
  const FilterGroup = ({ title, options, value, onChange, allLabel = '전체' }) => (
    <div className="filter-group">
      <div className="filter-title">{title}</div>
      <button type="button" className={`fchip ${value === '' ? 'on' : ''}`}
              onClick={() => onChange('')}>{allLabel}</button>
      {options.map((o) => {
        const val = o.value ?? o;
        const label = o.label ?? o;
        return (
          <button key={val} type="button"
                  className={`fchip ${value === val ? 'on' : ''}`}
                  onClick={() => onChange(val)}>
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="page mainpage wrap">
      {/* 좌측 필터 */}
      <aside className="side">
        <FilterGroup title="GAME" options={GAMES} value={game} onChange={setGame} />
        <FilterGroup title="MODE" options={GAME_MODES} value={gameMode} onChange={setGameMode} />
        <FilterGroup
          title="STATUS"
          options={[{ label: '모집중', value: 'RECRUITING' }, { label: '모집완료', value: 'CLOSED' }]}
          value={status} onChange={setStatus} allLabel="전체 보기"
        />
      </aside>

      {/* 메인 콘텐츠 */}
      <main>
        <div className="head">
          <h1>
            파티 찾기
            <span className="cnt">{posts.length}개의 파티 대기중</span>
          </h1>
          <button className="ui-btn-primary" onClick={writePost}>+ 모집글 작성</button>
        </div>

        {/* 검색바 */}
        <form className="searchbar" onSubmit={search}>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="title">제목 + 내용</option>
            <option value="nickname">글쓴이</option>
          </select>
          <input placeholder="어떤 파티를 찾으시나요? (예: 골드 듀오, 즐겜)"
                 value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <button className="btn-search" type="submit">검색</button>
        </form>

        {/* 카드 그리드 */}
        {posts.length === 0 ? (
          <div className="ui-empty"><p>조건에 맞는 모집글이 없습니다.</p></div>
        ) : (
          <div className="ui-grid">
            {posts.map((post) => {
              const recruiting = post.status === 'RECRUITING';
              const isValo = post.game && post.game.includes('발로란트');
              return (
                <div key={post.id} className={`ui-post-card${recruiting ? '' : ' is-closed'}`}>
                  <div className="ui-card-header">
                    <span className={`ui-game-badge${isValo ? ' is-valo' : ''}`}>
                      {post.game || '기타'}
                    </span>
                    <span className={`ui-status ${recruiting ? 'is-open' : 'is-done'}`}>
                      {recruiting ? '모집중' : '모집완료'}
                    </span>
                  </div>

                  <div className="ui-card-title" onClick={() => navigate(`/post/${post.id}`)}>
                    {post.title}
                  </div>

                  <div className="ui-tags">
                    {post.gameMode && <span className="ui-tag2">{post.gameMode}</span>}
                    <span className="ui-tag2">{post.currentMembers}/{post.targetMembers}명</span>
                  </div>

                  <div className="ui-card-footer">
                    <div className="ui-author">
                      <div className="ui-author-av">
                        {post.author.nickname?.[0] || '?'}
                      </div>
                      <div className="ui-author-info">
                        <div className="ui-author-name">
                          {post.author.nickname}
                          {post.author.tier && <span className="ui-tier">{post.author.tier}</span>}
                        </div>
                        <div className="ui-time">{timeAgo(post.createdAt)}</div>
                      </div>
                    </div>

                    {post.mine ? (
                      <button className="ui-btn-join" onClick={() => navigate(`/post/${post.id}`)}>
                        관리{post.pendingCount > 0 ? ` (신청 ${post.pendingCount})` : ''}
                      </button>
                    ) : post.myApplicationStatus ? (
                      <span className="ui-tag2">{STATUS_LABEL[post.myApplicationStatus]}</span>
                    ) : recruiting ? (
                      <button className="ui-btn-join" onClick={() => apply(post.id)}>참가 신청</button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}