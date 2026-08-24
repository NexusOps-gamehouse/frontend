import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';

export default function HouseInviteModal({ open, house, friends, friendsLoading, onClose, onInvite }) {
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSelected([]);
      setError('');
    }
  }, [open]);

  const unavailable = useMemo(() => new Set([
    ...(house?.members || []).map((member) => String(member.id)),
    ...(house?.invitations || []).map((invitation) => String(invitation.userId)),
  ]), [house]);

  const toggle = (friend) => {
    const id = String(friend.id);
    if (unavailable.has(id)) return;
    setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const users = friends.map((friend) => friend.user).filter((friend) => selected.includes(String(friend.id)));
      await onInvite(users);
      onClose();
    } catch (err) {
      setError(err.message || '친구를 초대하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={`${house?.name || 'House'}에 친구 초대`} onClose={onClose} footer={<>
      <button type="button" className="ui-btn-secondary" onClick={onClose}>취소</button>
      <button type="button" className="ui-btn-primary" onClick={submit}
              disabled={selected.length === 0 || submitting}>
        {submitting ? '초대 중…' : `${selected.length}명 초대`}
      </button>
    </>}>
      <p className="modal-description">친구를 여러 명 선택할 수 있습니다. 이미 멤버이거나 초대 중인 친구는 선택할 수 없습니다.</p>
      {friendsLoading && <div className="ui-empty"><p>친구 목록을 불러오는 중…</p></div>}
      {!friendsLoading && friends.length === 0 && <div className="ui-empty"><p>초대할 수 있는 친구가 없습니다.</p></div>}
      {!friendsLoading && friends.length > 0 && (
        <div className="modal-selection-list">
          {friends.map((friend) => {
            const person = friend.user;
            const id = String(person.id);
            const disabled = unavailable.has(id);
            return (
              <label key={id} className={`modal-selection-row${disabled ? ' disabled' : ''}`}>
                <input type="checkbox" checked={selected.includes(id)} disabled={disabled}
                       onChange={() => toggle(person)} />
                <Avatar user={person} />
                <span className="modal-selection-copy">
                  <strong>{person.nickname}</strong>
                  <small>{disabled ? '이미 멤버이거나 초대 중' : '초대 가능'}</small>
                </span>
              </label>
            );
          })}
        </div>
      )}
      {error && <div className="house-alert error" role="alert">{error}</div>}
    </Modal>
  );
}
