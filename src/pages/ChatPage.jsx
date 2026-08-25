import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { WS_URL } from '../config';

const wsUrl = WS_URL;

export default function ChatPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const bottomRef = useRef(null);
  // 이전 메시지를 앞에 붙일 때는 맨 아래로 스크롤하면 안 된다.
  // (읽던 위치에서 아래로 튀어버린다)
  const keepScrollRef = useRef(false);

  const isOwner = room && user && room.postAuthorId === user.id;

  /** 방 입장 — 방 정보 + 최근 메시지 */
  const loadRoom = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/rooms/${roomId}`);
      setRoom(data.room);
      setMessages(data.messages);
      setHasMore(data.hasMore);
    } catch (err) {
      alert(errMsg(err));
      navigate('/');
    }
  }, [roomId, navigate]);

  /**
   * 방 정보만 갱신 (확정·강퇴·모집완료 후).
   *
   * loadRoom 을 쓰면 messages 가 최근 묶음으로 리셋돼서
   * "이전 메시지"로 불러온 이력이 사라진다.
   */
  const refreshRoom = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/rooms/${roomId}`);
      setRoom(data.room);
    } catch { /* 무시 */ }
  }, [roomId]);

  /** 이전 메시지 — 지금 가진 것 중 가장 오래된 id 를 커서로 쓴다 */
  const loadOlder = useCallback(async () => {
    if (!messages.length || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/chat/rooms/${roomId}/messages`, {
        params: { before: messages[0].id },
      });
      keepScrollRef.current = true;
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, messages, loadingMore]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/rooms.${roomId}`, (frame) => {
          const msg = JSON.parse(frame.body);
          setMessages((prev) => [...prev, msg]);
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); };
  }, [roomId]);

  useEffect(() => {
    // 이전 메시지를 앞에 붙인 직후에는 스크롤을 건드리지 않는다.
    if (keepScrollRef.current) {
      keepScrollRef.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/rooms/${roomId}`,
      body: JSON.stringify({ content }),
    });
    setInput('');
  };

  const confirmMember = async (applicationId) => {
    try { await api.post(`/applications/${applicationId}/confirm`); refreshRoom(); }
    catch (err) { alert(errMsg(err)); }
  };

  const kick = async (userId, nickname) => {
    if (!confirm(`${nickname}님을 파티에서 내보낼까요? (신청도 거절 처리됩니다)`)) return;
    try { await api.delete(`/chat/rooms/${roomId}/members/${userId}`); refreshRoom(); }
    catch (err) { alert(errMsg(err)); }
  };

  const closeRecruit = async () => {
    // TODO(house-suggestion): 이 동작은 신규 모집만 닫는다. 실제 game/party 종료 이벤트가
    // participant 목록과 고유 suggestionId를 제공하면 HouseCreateSuggestionModal을 연결한다.
    if (!confirm('모집을 완료 처리할까요? 이후 참가 신청을 받지 않습니다.')) return;
    try { await api.post(`/posts/${room.postId}/close`); refreshRoom(); }
    catch (err) { alert(errMsg(err)); }
  };

  if (!room) return null;

  return (
    <div className="page">
      <div className="center chat">
        {/* 헤더 */}
        <div className="between"
             style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div>
            <div className="name" style={{ cursor: 'pointer' }}
                 onClick={() => navigate(`/post/${room.postId}`)}>
              {room.postTitle}
            </div>
            <div className="meta">파티원 {room.members.length}명 · {room.postStatus === 'RECRUITING' ? '모집중' : '모집완료'}</div>
          </div>
          {isOwner && room.postStatus === 'RECRUITING' && (
            <button className="btn sm" onClick={closeRecruit}>모집완료</button>
          )}
        </div>

        <div className="chat-layout">
          {/* 참여자 사이드바 */}
          <aside className="chat-sidebar">
            <div className="meta" style={{ fontWeight: 700, marginBottom: 2 }}>참여자 {room.members.length}</div>
            {room.members.map((m) => (
              <div key={m.user.id} className="member-chip">
                <span onClick={() => navigate(`/profile/${m.user.id}`)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar user={m.user} size="sm" />
                  <span style={{ fontSize: 12 }}>{m.user.nickname}</span>
                </span>
                <span className="member-actions">
                  {m.owner && <span className="ui-tag is-primary">방장</span>}
                  {!m.owner && m.confirmed && <span className="ui-tag is-online">✔ 확정</span>}
                  {isOwner && !m.owner && !m.confirmed && m.applicationId && (
                    <button className="textlink" onClick={() => confirmMember(m.applicationId)}>확정</button>
                  )}
                  {isOwner && !m.owner && !m.confirmed && (
                    <button className="textlink" onClick={() => kick(m.user.id, m.user.nickname)}>내보내기</button>
                  )}
                </span>
              </div>
            ))}
          </aside>

          {/* 메시지 영역 */}
          <div className="chat-main">
            <div className="chat-messages">
              {hasMore && (
                <div className="older-wrap">
                  <button type="button" className="btn-older"
                          disabled={loadingMore} onClick={loadOlder}>
                    {loadingMore ? '불러오는 중…' : '이전 메시지 보기'}
                  </button>
                </div>
              )}
              {messages.map((m) => {
                const mine = m.senderId === user?.id;
                return mine ? (
                  <div key={m.id} className="msg-row is-me">
                    <div className="bubble me">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="msg-row">
                    <Avatar user={{ nickname: m.senderNickname }} size="sm" />
                    <div className="msg-body">
                      <div className="meta" style={{ marginBottom: 2 }}>{m.senderNickname}</div>
                      <div className="bubble">{m.content}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form className="flex" onSubmit={send}>
              <input className="inp" style={{ flex: 1, margin: 0 }}
                     placeholder={connected ? '메시지 입력' : '연결 중...'}
                     value={input} onChange={(e) => setInput(e.target.value)} />
              <button className="btn" style={{ width: 80 }} type="submit" disabled={!connected}>
                전송
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
