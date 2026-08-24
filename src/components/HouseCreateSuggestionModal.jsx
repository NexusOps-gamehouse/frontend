import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dismissHouseSuggestion, getHouseSuggestionState } from '../api/houses';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

export default function HouseCreateSuggestionModal({ open, suggestionId, participants = [], onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!open || !suggestionId) {
      setVisible(false);
      return () => { alive = false; };
    }
    getHouseSuggestionState(suggestionId, user)
      .then((state) => { if (alive) setVisible(!state.dismissed); })
      .catch(() => { if (alive) setVisible(true); });
    return () => { alive = false; };
  }, [open, suggestionId, user]);

  const dismiss = async () => {
    try { await dismissHouseSuggestion(suggestionId, user); }
    finally {
      setVisible(false);
      onClose?.();
    }
  };

  const createHouse = async () => {
    try { await dismissHouseSuggestion(suggestionId, user); }
    finally {
      navigate('/houses/new', {
        state: { invitedFriends: participants, sourceSuggestionId: suggestionId },
      });
    }
  };

  return (
    <Modal open={open && visible} title="🎮 이번 게임은 어떠셨나요?" onClose={dismiss} size="sm" footer={<>
      <button type="button" className="ui-btn-secondary" onClick={dismiss}>나중에</button>
      <button type="button" className="ui-btn-primary" onClick={createHouse}>House 만들기</button>
    </>}>
      <div className="house-suggestion-copy">
        <div className="house-suggestion-icon" aria-hidden="true">🏠</div>
        <p>함께 플레이한 사람들과 계속 게임하고 싶다면 House를 만들어보세요.</p>
        {participants.length > 0 && (
          <div className="house-suggestion-people" aria-label="함께 플레이한 사용자">
            {participants.map((person) => <span key={person.id}>{person.nickname || person.name}</span>)}
          </div>
        )}
      </div>
    </Modal>
  );
}
