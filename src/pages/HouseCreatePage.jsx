import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createHouse } from '../api/houses';
import './Houses.css';

const MAX_MEMBER_OPTIONS = [5, 10, 20, 30, 50];

const OPTIONS = {
  visibility: [
    { value: 'PUBLIC', icon: '🌐', title: '공개', description: '누구나 찾을 수 있고 바로 가입할 수 있어요.' },
    { value: 'PRIVATE', icon: '🔒', title: '비공개', description: '가입 신청 후 방장의 승인이 필요해요.' },
  ],
};

function ChoiceGroup({ label, name, value, options, onChange }) {
  return (
    <fieldset className="house-choice-group">
      <legend>{label}</legend>
      <div className="house-choice-grid">
        {options.map((option) => (
          <label key={option.value} className={`house-choice ${value === option.value ? 'selected' : ''}`}>
            <input type="radio" name={name} value={option.value}
                   checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="house-choice-icon" aria-hidden="true">{option.icon}</span>
            <span>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function HouseCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const recommendedFriends = useMemo(() => {
    const candidates = Array.isArray(location.state?.invitedFriends) ? location.state.invitedFriends : [];
    return candidates.filter((friend) => friend?.id).map((friend) => ({
      id: String(friend.id), nickname: friend.nickname || friend.name || '친구',
    }));
  }, [location.state]);
  const [invitedFriends, setInvitedFriends] = useState(recommendedFriends);
  useEffect(() => { setInvitedFriends(recommendedFriends); }, [recommendedFriends]);
  const [form, setForm] = useState({
    name: '', description: '', maxMembers: 20,
    visibility: invitedFriends.length > 0 ? 'PRIVATE' : 'PUBLIC',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdHouseId, setCreatedHouseId] = useState(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (createdHouseId) return;
    setError('');
    if (!form.name.trim()) {
      setError('House 이름을 입력해주세요.');
      return;
    }
    if (invitedFriends.length > 0 && form.visibility !== 'PRIVATE') {
      setError('선택한 친구를 초대하려면 비공개 House로 만들어주세요.');
      return;
    }

    setLoading(true);
    let house;
    try {
      house = await createHouse(form);
      setCreatedHouseId(house.id);
    } catch (err) {
      setError(err.message || 'House를 만들지 못했습니다.');
      setLoading(false);
      return;
    }

    navigate(`/houses/${house.id}`, {
      replace: true,
      state: invitedFriends.length > 0
        ? { houseCreationNotice: 'House는 생성되었지만 Crew 초대 API가 없어 친구 초대는 저장되지 않았습니다.' }
        : undefined,
    });
  };

  return (
    <div className="page houses-page">
      <div className="house-form-panel">
        <div className="house-form-head">
          <span className="house-eyebrow">CREATE YOUR HOUSE</span>
          <h1>새 House 만들기</h1>
          <p>House를 만든 회원은 자동으로 방장이 됩니다.</p>
        </div>

        <form onSubmit={submit}>
          <label className="house-field">
            <span>House 이름 <b>*</b></span>
            <input className="inp" maxLength={30} placeholder="House 이름을 입력해주세요."
                   value={form.name} onChange={(event) => update('name', event.target.value)} required />
            <small>{form.name.length}/30</small>
          </label>
          <label className="house-field">
            <span>House 소개</span>
            <textarea className="inp" maxLength={300}
                      placeholder="어떤 멤버들과 어떤 활동을 하고 싶은지 소개해주세요."
                      value={form.description}
                      onChange={(event) => update('description', event.target.value)} />
            <small>{form.description.length}/300</small>
          </label>

          <label className="house-field">
            <span>최대 인원 <b>*</b></span>
            <select className="inp" value={form.maxMembers}
                    onChange={(event) => update('maxMembers', Number(event.target.value))} required>
              {MAX_MEMBER_OPTIONS.map((count) => (
                <option key={count} value={count}>{count}명</option>
              ))}
            </select>
          </label>

          <ChoiceGroup label="공개 설정" name="visibility" value={form.visibility}
                       options={OPTIONS.visibility} onChange={(value) => update('visibility', value)} />

          {invitedFriends.length > 0 && (
            <div className="house-prefill-invites">
              <strong>House 생성 화면에서 선택된 친구</strong>
              <div>{invitedFriends.map((friend) => (
                <span key={friend.id}>
                  {friend.nickname}
                  <button type="button" onClick={() => setInvitedFriends((prev) => prev.filter((item) => item.id !== friend.id))}
                          aria-label={`${friend.nickname} 초대 예정에서 제외`}>×</button>
                </span>
              ))}</div>
              <small>Crew 초대 API가 제공되지 않아 이번 생성 요청에는 포함되지 않습니다.</small>
            </div>
          )}

          {form.visibility === 'PRIVATE' && (
            <div className="house-alert">🔒 비공개 House는 가입 신청 후 방장의 승인이 필요합니다.</div>
          )}
          {error && <div className="house-alert error">{error}</div>}

          <div className="house-form-actions">
            <button className="ui-btn-secondary" type="button" onClick={() => navigate(-1)}>취소</button>
            <button className="ui-btn-primary" type="submit" disabled={loading || Boolean(createdHouseId)}>
              {createdHouseId ? 'House 생성 완료' : loading ? '만드는 중…' : 'House 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
