import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ChatListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [postsRes, appsRes] = await Promise.all([
          api.get('/my/posts').catch(() => ({ data: [] })),
          api.get('/my/applications').catch(() => ({ data: [] })),
        ]);

        const mine = (postsRes.data || [])
          .filter((p) => p.chatRoomId)
          .map((p) => ({
            chatRoomId: p.chatRoomId,
            title: p.title,
            role: 'owner',
          }));

        const joined = (appsRes.data || [])
          .filter((a) => a.chatRoomId && (a.status === 'APPROVED' || a.status === 'CONFIRMED'))
          .map((a) => ({
            chatRoomId: a.chatRoomId,
            title: a.postTitle,
            role: a.status === 'CONFIRMED' ? 'confirmed' : 'member',
          }));

        // chatRoomId 기준 중복 제거 (내 글이 우선)
        const map = new Map();
        [...mine, ...joined].forEach((r) => {
          if (!map.has(r.chatRoomId)) map.set(r.chatRoomId, r);
        });
        setRooms([...map.values()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const roleLabel = { owner: '방장', confirmed: '✔ 확정', member: '참여중' };

  return (
    <div className="page">
      <div className="ui-narrow">
        <p className="ui-section-title" style={{ marginTop: 0 }}>내 채팅방</p>

        {loading && <div className="ui-empty"><p>불러오는 중...</p></div>}

        {!loading && rooms.length === 0 && (
          <div className="ui-empty">
            <p>참여 중인 채팅방이 없습니다.<br />파티에 참가하면 채팅방이 열려요.</p>
          </div>
        )}

        {rooms.map((room) => (
          <div
            key={room.chatRoomId}
            className="ui-list-row"
            onClick={() => navigate(`/chat/${room.chatRoomId}`)}
          >
            <span className="row-title">{room.title}</span>
            <span className={`ui-tag${room.role === 'owner' ? ' is-primary' : room.role === 'confirmed' ? ' is-online' : ''}`}>
              {roleLabel[room.role]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}