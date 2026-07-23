import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { timeAgo } from '../utils';
import logo from '../assets/Gamehouse-Pont.png';
import brandLogo from '../assets/Gamehouse-Logo.png';

const POLL_INTERVAL = 10000;

export default function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const lastNotiId = useRef(null);
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

  return (
    <>
      <nav className="gnb">
<div className="gnb-inner">
  <div className="gnb-left">
    <Link to="/" className="logo-img" aria-label="GAME HOUSE 홈">
      <img src={brandLogo} alt="GAME HOUSE 로고" className="logo-img-brand" />
      <img src={logo} alt="GAME HOUSE" />
    </Link>

    {user && (
      <div className="gnb-menu">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          모집글
        </NavLink>
        <NavLink to="/mypage" className={({ isActive }) => (isActive ? 'active' : '')}>
          내 파티
        </NavLink>
        <NavLink to="/chat" end className={({ isActive }) => (isActive ? 'active' : '')}>
          채팅
        </NavLink>
      </div>
    )}
  </div>
             
          <div className="gnb-r">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                <div className="noti-wrap" ref={wrapRef}>
                  <button className="icon-btn" onClick={toggleNoti} aria-label="알림">
                    🔔
                    {unread > 0 && <span className="badge">{unread > 99 ? '99+' : unread}</span>}
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

                <button className="profile-btn" onClick={() => navigate('/mypage')}>
                  <span className="profile-av">{user.nickname?.[0] || '?'}</span>
                  <span>{user.nickname}</span>
                </button>
              </>
            ) : (
              <>
                <Link className="ui-btn-primary" to="/login"
                      style={{ height: 40, padding: '0 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center' }}>
                  로그인
                </Link>
                <Link className="ui-btn-primary" to="/signup"
                      style={{ height: 40, padding: '0 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center' }}>
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {toast && <div className="toast">🔔 {toast}</div>}
    </>
  );
}
