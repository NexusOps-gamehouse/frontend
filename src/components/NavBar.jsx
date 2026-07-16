import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils';

const POLL_INTERVAL = 10000;

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const lastNotiId = useRef(null); // 마지막으로 본 알림 id (토스트 중복 방지)
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    let initialized = false;

    const poll = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (!alive) return;
        setItems(data.items);
        setUnread(data.unreadCount);
        const newest = data.items[0];
        if (initialized && newest && !newest.read && newest.id !== lastNotiId.current) {
          setToast(newest.message);
          setTimeout(() => setToast(null), 3500);
        }
        if (newest) lastNotiId.current = newest.id;
        initialized = true;
      } catch { /* 무시 */ }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { alive = false; clearInterval(id); };
  }, [user]);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleNoti = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await api.post('/notifications/read-all');
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch { /* 무시 */ }
    }
  };

  const clickNoti = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const doLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="gnb">
        <Link to="/" className="logo">DUO.GG</Link>
        <div className="gnb-r">
          {user ? (
            <>
              <div className="noti-wrap" ref={wrapRef}>
                <button className="chip" onClick={toggleNoti}>
                  🔔{unread > 0 ? ` ${unread}` : ''}
                </button>
                {open && (
                  <div className="noti-dropdown">
                    {items.length === 0 && <div className="noti-empty">알림이 없습니다.</div>}
                    {items.map((n) => (
                      <div key={n.id}
                           className={`noti-item ${n.read ? '' : 'unread'}`}
                           onClick={() => clickNoti(n)}>
                        <div>{n.message}</div>
                        <div className="meta">{timeAgo(n.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="chip" onClick={() => navigate('/mypage')}>마이페이지</button>
              <button className="chip" onClick={doLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <button className="chip" onClick={() => navigate('/login')}>로그인</button>
              <button className="chip" onClick={() => navigate('/signup')}>회원가입</button>
            </>
          )}
        </div>
      </nav>
      {toast && <div className="toast">🔔 {toast}</div>}
    </>
  );
}
