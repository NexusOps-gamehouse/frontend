import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function ChatPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const bottomRef = useRef(null);

  const isOwner = room && user && room.postAuthorId === user.id;

  const loadRoom = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/rooms/${roomId}`);
      setRoom(data.room);
      setMessages(data.messages);
    } catch (err) {
      alert(errMsg(err));
      navigate('/');
    }
  }, [roomId, navigate]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
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
    try { await api.post(`/applications/${applicationId}/confirm`); loadRoom(); }
    catch (err) { alert(errMsg(err)); }
  };

  const kick = async (userId, nickname) => {
    if (!confirm(`${nickname}님을 파티에서 내보낼까요? (신청도 거절 처리됩니다)`)) return;
    try { await api.delete(`/chat/rooms/${roomId}/members/${userId}`); loadRoom(); }
    catch (err) { alert(errMsg(err)); }
  };

  const closeRecruit = async () => {
    if (!confirm('모집을 완료 처리할까요? 이후 참가 신청을 받지 않습니다.')) return;
    try { await api.post(`/posts/${room.postId}/close`); loadRoom(); }
    catch (err) { alert(errMsg(err)); }
  };

  if (!room) return null;

  return (
    <div className="page">
      <div className="center chat">
        {/* 헤더 */}
        <div className="between"
             style={{ paddingBottom: 12, borderBottom: '1px solid #e5e5e5', marginBottom: 12 }}>
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

        {/* 멤버 목록 */}
        <div className="flex" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {room.members.map((m) => (
            <div key={m.user.id} className="member-chip">
              <span onClick={() => navigate(`/profile/${m.user.id}`)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar user={m.user} size="sm" />
                <span style={{ fontSize: 12 }}>{m.user.nickname}</span>
              </span>
              {m.owner && <span className="tag">방장</span>}
              {!m.owner && m.confirmed && <span className="tag">✔ 확정</span>}
              {isOwner && !m.owner && !m.confirmed && m.applicationId && (
                <button className="textlink" onClick={() => confirmMember(m.applicationId)}>확정</button>
              )}
              {isOwner && !m.owner && (
                <button className="textlink" onClick={() => kick(m.user.id, m.user.nickname)}>내보내기</button>
              )}
            </div>
          ))}
        </div>

        {/* 메시지 */}
        <div className="chat-messages">
          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return mine ? (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <div className="bubble me">{m.content}</div>
              </div>
            ) : (
              <div key={m.id} className="flex" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
                <Avatar user={{ nickname: m.senderNickname }} size="sm" />
                <div>
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
  );
}
