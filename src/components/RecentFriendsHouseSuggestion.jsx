import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dismissHouseSuggestion, getHouseSuggestionState } from '../api/houses';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import Modal from './Modal';

export default function RecentFriendsHouseSuggestion({ open, suggestionId, friends = [], onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    let alive = true;
    if (!open || !suggestionId) {
      setVisible(false);
      return () => { alive = false; };
    }
    setSelected(friends.map((friend) => String(friend.id)));
    getHouseSuggestionState(suggestionId, user)
      .then((state) => { if (alive) setVisible(!state.dismissed); })
      .catch(() => { if (alive) setVisible(true); });
    return () => { alive = false; };
  }, [open, suggestionId, friends, user]);

  const dismiss = async () => {
    try { await dismissHouseSuggestion(suggestionId, user); }
    finally {
      setVisible(false);
      onClose?.();
    }
  };

  const createHouse = async () => {
    const invitedFriends = friends.filter((friend) => selected.includes(String(friend.id)));
    try { await dismissHouseSuggestion(suggestionId, user); }
    finally {
      navigate('/houses/new', {
        state: { invitedFriends, sourceSuggestionId: suggestionId },
      });
    }
  };

  return (
    <Modal open={open && visible} title="최근 함께 플레이한 친구들이 많아요!" onClose={dismiss} footer={<>
      <button type="button" className="ui-btn-secondary" onClick={dismiss}>나중에</button>
      <button type="button" className="ui-btn-primary" onClick={createHouse} disabled={selected.length === 0}>
        선택한 친구와 House 만들기
      </button>
    </>}>
      <p className="modal-description">이 사람들과 House를 만들어 다음 게임을 함께해보세요.</p>
      {friends.length === 0 ? (
        <div className="ui-empty"><p>추천할 친구가 없습니다.</p></div>
      ) : (
        <div className="modal-selection-list">
          {friends.map((friend) => {
            const id = String(friend.id);
            return (
              <label className="modal-selection-row" key={id}>
                <input type="checkbox" checked={selected.includes(id)} onChange={() => {
                  setSelected((prev) => prev.includes(id)
                    ? prev.filter((item) => item !== id) : [...prev, id]);
                }} />
                <Avatar user={friend} />
                <span className="modal-selection-copy"><strong>{friend.nickname || friend.name}</strong><small>최근 함께 플레이함</small></span>
              </label>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
