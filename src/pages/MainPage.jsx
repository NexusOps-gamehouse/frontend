import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { GAMES, GAME_MODES } from '../constants';
import { timeAgo } from '../utils';
import TierBadge from '../components/TierBadge';
import SmartMatchPanel from '../components/SmartMatchPanel';
import './MainPage.css';

const STATUS_LABEL = { PENDING: '대기중', APPROVED: '승인됨', CONFIRMED: '확정', REJECTED: '거절됨' };

const PAGE_SIZE = 20;

// 상단 가로 필터바용 칩 그룹. 기존 좌측 세로 필터(FilterGroup)를 가로 배치로 바꾼 버전 —
// 선택 로직(전체=리셋, 단일 선택)은 동일하다.
function FilterGroup({ label, options, value, onChange, allLabel = '전체' }) {
  return (
    <div className="fgroup">
      <span className="flabel">{label}</span>
      <button type="button" className={`fchip ${value === '' ? 'on' : ''}`}
              onClick={() => onChange('')}>{allLabel}</button>
      {options.map((o) => {
        const val = o.value ?? o;
        const label2 = o.label ?? o;
        return (
          <button key={val} type="button"
                  className={`fchip ${value === val ? 'on' : ''}`}
                  onClick={() => onChange(val)}>
            {label2}
          </button>
        );
      })}
    </div>
  );
}

export default function MainPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('title');
  const [keyword, setKeyword] = useState('');
  const [game, setGame] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [status, setStatus] = useState('');

  /**
   * 목록 조회.
   *
   * 서버가 전체가 아니라 한 페이지씩 돌려준다. nextPage 가 0 이면 새로 검색한
   * 것이므로 목록을 갈아끼우고, 그보다 크면 "더 보기"이므로 뒤에 이어 붙인다.
   */
  const load = useCallback(async (nextPage = 0, kw = keyword) => {
    setLoading(true);
    try {
      const { data } = await api.get('/posts', {
        params: { searchType, keyword: kw, game, gameMode, status,
                  page: nextPage, size: PAGE_SIZE },
      });
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.content)
            ? data.content
            : [];

      setPosts((prev) => {
        const previous = Array.isArray(prev) ? prev : [];
        return nextPage === 0 ? items : [...previous, ...items];
      });
      setTotal((prev) => {
        if (typeof data?.totalElements === 'number') return data.totalElements;
        if (nextPage === 0) return items.length;
        return Math.max(Number.isFinite(prev) ? prev : 0, nextPage * PAGE_SIZE + items.length);
      });
      setHasNext(typeof data?.hasNext === 'boolean' ? data.hasNext : false);
      setPage(typeof data?.page === 'number' ? data.page : nextPage);
    } catch {
      // 이전 상태가 비정상이어도 렌더링에서 posts.length를 안전하게 사용할 수 있게 한다.
      setPosts((prev) => (Array.isArray(prev) ? prev : []));
      setTotal((prev) => (Number.isFinite(prev) ? prev : 0));
      setHasNext(false);
      setPage((prev) => (Number.isFinite(prev) ? prev : 0));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType, keyword, game, gameMode, status]);

  useEffect(() => { load(0); }, [game, gameMode, status]); // 필터 변경 시 첫 페이지부터 재조회
  // eslint-disable-line react-hooks/exhaustive-deps

  const search = (e) => {
    e.preventDefault();
    load(0);
  };

  const apply = async (postId) => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/posts/${postId}/apply`);
      alert('참가 신청이 완료되었습니다!');
      // 목록을 통째로 다시 부르지 않고 해당 카드만 갱신한다.
      // (전체 재조회를 하면 "더 보기"로 쌓아둔 페이지가 사라진다)
      setPosts((prev) => prev.map((p) => (
        p.id === postId ? { ...p, myApplicationStatus: 'PENDING' } : p
      )));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const writePost = () => {
    if (!user) { navigate('/login'); return; }
    navigate('/post/new');
  };

  return (
    <div className="page mainpage wrap">
      {/* 중앙 콘텐츠 */}
      <main>
        <div className="head">
          <h1>
            듀오 찾기
            <span className="cnt">{total}개의 파티 대기중</span>
          </h1>
          <button className="ui-btn-primary" onClick={writePost}>+ 모집글 작성</button>
        </div>

        {/* 상단 가로 필터바 */}
        <div className="filterbar">
          <FilterGroup label="GAME" options={GAMES} value={game} onChange={setGame} />
          <div className="divider" />
          <FilterGroup label="MODE" options={GAME_MODES} value={gameMode} onChange={setGameMode} />
          <div className="divider" />
          <FilterGroup
            label="STATUS"
            options={[{ label: '모집중', value: 'RECRUITING' }, { label: '모집완료', value: 'CLOSED' }]}
            value={status} onChange={setStatus} allLabel="전체 보기"
          />
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
                          <TierBadge user={post.author} />
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

        {hasNext && (
          <div className="more-wrap">
            <button className="ui-btn-more" type="button" disabled={loading}
                    onClick={() => load(page + 1)}>
              {loading ? '불러오는 중…' : `더 보기 (${posts.length} / ${total})`}
            </button>
          </div>
        )}
      </main>

      {/* 우측: 스마트 매칭 */}
      <SmartMatchPanel />
    </div>
  );
}
