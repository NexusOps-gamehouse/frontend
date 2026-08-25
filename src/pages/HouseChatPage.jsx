import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getHouse,
  listHouseMessages,
  sendHouseMessage,
  subscribeHouseMessages,
} from '../api/houses';
import { useAuth } from '../context/AuthContext';
import './HouseChatPage.css';

const MEMBER_ROLES = ['OWNER', 'MANAGER', 'MEMBER'];
const ROLE_LABEL = { OWNER: '방장', MANAGER: '부방장', MEMBER: '일반 멤버' };
const TIME_FORMAT = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' });

const userKey = (user) => String(user?.id ?? user?.userId ?? user?.email ?? user?.nickname ?? '');

const formatTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '시간 정보 없음' : TIME_FORMAT.format(date);
};

const isAccessError = (error) => (
  error?.code === 'PRIVATE_HOUSE' || /House 멤버/.test(error?.message || '')
);

export default function HouseChatPage() {
  const { houseId } = useParams();
  const { user } = useAuth();
  const [house, setHouse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef(null);

  const denyAccess = useCallback((message) => {
    setHouse(null);
    setMessages([]);
    setAccessDenied(true);
    setError(message || 'House 멤버만 채팅을 이용할 수 있습니다.');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setAccessDenied(false);
    try {
      const [houseData, messageData] = await Promise.all([
        getHouse(houseId, user),
        listHouseMessages(houseId, user),
      ]);
      if (!MEMBER_ROLES.includes(houseData.myStatus)) {
        denyAccess('House 멤버만 채팅을 이용할 수 있습니다.');
        return;
      }
      setHouse(houseData);
      setMessages(messageData);
    } catch (err) {
      if (isAccessError(err)) denyAccess(err.message);
      else setError(err.message || 'House 채팅을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [denyAccess, houseId, user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let closed = false;
    let unsubscribe = () => {};
    subscribeHouseMessages(houseId, user, (nextMessages, subscriptionError) => {
      if (closed) return;
      if (subscriptionError) {
        if (isAccessError(subscriptionError)) denyAccess(subscriptionError.message);
        else setError(subscriptionError.message || '새 메시지를 불러오지 못했습니다.');
        return;
      }
      setMessages(nextMessages || []);
    }).then((cleanup) => {
      if (closed) cleanup();
      else unsubscribe = cleanup;
    }).catch((err) => {
      if (closed) return;
      if (isAccessError(err)) denyAccess(err.message);
      else setError(err.message || 'House 채팅 연결을 시작하지 못했습니다.');
    });
    return () => {
      closed = true;
      unsubscribe();
    };
  }, [denyAccess, houseId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    if (sending) return;
    const content = input.trim();
    if (!content) {
      setSendError('메시지를 입력해주세요.');
      return;
    }
    if (content.length > 500) {
      setSendError('메시지는 500자 이하로 입력해주세요.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      const sent = await sendHouseMessage(houseId, content, user);
      setMessages((prev) => prev.some((message) => message.id === sent.id)
        ? prev : [...prev, sent].slice(-100));
      setInput('');
    } catch (err) {
      if (isAccessError(err)) denyAccess(err.message);
      else setSendError(err.message || '메시지를 보내지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  if (loading) return (
    <div className="page house-chat-page"><div className="ui-empty"><p>House 채팅을 불러오는 중…</p></div></div>
  );

  if (accessDenied) return (
    <div className="page house-chat-page">
      <div className="ui-empty house-chat-denied">
        <div aria-hidden="true">🔒</div>
        <h1>House 채팅에 접근할 수 없습니다</h1>
        <p>{error}</p>
        <Link className="ui-btn-secondary" to={`/houses/${houseId}`}>House 상세로</Link>
      </div>
    </div>
  );

  if (!house || error) return (
    <div className="page house-chat-page">
      <div className="ui-empty house-chat-denied">
        <h1>House 채팅을 열지 못했습니다</h1>
        <p>{error || '잠시 후 다시 시도해주세요.'}</p>
        <div className="house-chat-error-actions">
          <Link className="ui-btn-secondary" to={`/houses/${houseId}`}>House 상세로</Link>
          <button className="ui-btn-primary" type="button" onClick={load}>다시 시도</button>
        </div>
      </div>
    </div>
  );

  const viewerId = userKey(user);

  return (
    <div className="page house-chat-page">
      <Link className="house-back" to={`/houses/${houseId}`}>← House 상세</Link>
      <section className="house-chat-panel">
        <header className="house-chat-header">
          <div>
            <span className="house-eyebrow">HOUSE CHAT</span>
            <h1>{house.name}</h1>
            <p>{house.members.length}명의 House 멤버가 함께하는 전용 채팅입니다.</p>
          </div>
          <span className={`role-badge ${house.myStatus.toLowerCase()}`}>{ROLE_LABEL[house.myStatus]}</span>
        </header>

        <div className="house-chat-messages" aria-live="polite" aria-label="House 채팅 메시지">
          {messages.length === 0 ? (
            <div className="ui-empty house-chat-empty">
              <p>아직 메시지가 없습니다.<br />House 멤버에게 첫 메시지를 보내보세요.</p>
            </div>
          ) : messages.map((message) => {
            const mine = String(message.author?.id) === viewerId;
            return (
              <article className={`house-chat-message ${mine ? 'mine' : ''}`} key={message.id}>
                {!mine && <div className="ui-author-av" aria-hidden="true">{message.author?.nickname?.[0] || '?'}</div>}
                <div className="house-chat-message-body">
                  <div className="house-chat-message-meta">
                    <strong>{message.author?.nickname || 'House 멤버'}</strong>
                    <span className={`role-badge ${message.author?.role?.toLowerCase() || 'member'}`}>
                      {ROLE_LABEL[message.author?.role] || '일반 멤버'}
                    </span>
                    <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                  </div>
                  <p>{message.content}</p>
                </div>
                {mine && <div className="ui-author-av" aria-hidden="true">{message.author?.nickname?.[0] || '?'}</div>}
              </article>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="house-chat-composer" onSubmit={send}>
          {sendError && <div className="house-alert error" role="alert">{sendError}</div>}
          <div className="house-chat-input-row">
            <textarea value={input} maxLength={500} rows={2} disabled={sending}
                      onChange={(event) => {
                        setInput(event.target.value);
                        if (sendError) setSendError('');
                      }}
                      onKeyDown={handleInputKeyDown}
                      aria-label="House 채팅 메시지" placeholder="메시지를 입력하세요. Shift+Enter로 줄바꿈" />
            <button className="ui-btn-primary" type="submit" disabled={sending || !input.trim()}>
              {sending ? '전송 중…' : '전송'}
            </button>
          </div>
          <small>{input.length}/500</small>
        </form>
      </section>
    </div>
  );
}
