import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const FriendContext = createContext(null);

export function FriendProvider({ children }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);   // FriendDto[] (status ACCEPTED)
  const [received, setReceived] = useState([]); // 내가 받은 대기 신청
  const [sent, setSent] = useState([]);         // 내가 보낸 대기 신청
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [f, r] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
      ]);
      setFriends(f.data);
      setReceived(r.data.received || []);
      setSent(r.data.sent || []);
    } catch { /* 무시 */ }
    finally { setLoading(false); }
  }, [user]);

  // 로그인 시 1회 로드, 로그아웃 시 초기화
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setFriends([]);
      setReceived([]);
      setSent([]);
    }
  }, [user, refresh]);

  // 상대 userId 기준 관계 판별
  const getRelation = useCallback((userId) => {
    if (!userId) return 'NONE';
    if (user && Number(user.id) === Number(userId)) return 'SELF';
    if (friends.some((f) => f.user.id === userId)) return 'FRIEND';
    if (sent.some((f) => f.user.id === userId)) return 'SENT';
    if (received.some((f) => f.user.id === userId)) return 'RECEIVED';
    return 'NONE';
  }, [user, friends, sent, received]);

  // 대기 신청 건의 requestId (수락/취소용). 없으면 null
  const getRequestId = useCallback((userId) => {
    const hit = received.find((f) => f.user.id === userId)
      || sent.find((f) => f.user.id === userId);
    return hit ? hit.id : null;
  }, [received, sent]);

  const sendRequest = useCallback(async (userId) => {
    const { data } = await api.post('/friends/requests', { receiverId: userId });
    if (data.status === 'ACCEPTED') {
      // 역방향 대기 신청이 자동 수락된 경우: 친구로 편입, 받은 신청에서 제거
      setReceived((prev) => prev.filter((f) => f.user.id !== userId));
      setFriends((prev) => [data, ...prev.filter((f) => f.user.id !== userId)]);
    } else {
      setSent((prev) => [data, ...prev.filter((f) => f.user.id !== userId)]);
    }
    return data;
  }, []);

  const acceptRequest = useCallback(async (requestId) => {
    const { data } = await api.post(`/friends/requests/${requestId}/accept`);
    setReceived((prev) => prev.filter((f) => f.id !== requestId));
    setFriends((prev) => [data, ...prev.filter((f) => f.user.id !== data.user.id)]);
    return data;
  }, []);

  // 거절(받은 신청) / 취소(보낸 신청) 공용
  const deleteRequest = useCallback(async (requestId) => {
    await api.delete(`/friends/requests/${requestId}`);
    setReceived((prev) => prev.filter((f) => f.id !== requestId));
    setSent((prev) => prev.filter((f) => f.id !== requestId));
  }, []);

  const unfriend = useCallback(async (userId) => {
    await api.delete(`/friends/${userId}`);
    setFriends((prev) => prev.filter((f) => f.user.id !== userId));
  }, []);

  const value = {
    friends, received, sent, loading,
    receivedCount: received.length,
    getRelation, getRequestId,
    sendRequest, acceptRequest, deleteRequest, unfriend, refresh,
  };

  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
}

export const useFriends = () => useContext(FriendContext);
