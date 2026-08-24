import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createHouse } from '../api/houses';
import { useAuth } from '../context/AuthContext';
import { GAMES } from '../constants';
import './Houses.css';

const MAX_MEMBER_OPTIONS = [5, 10, 20, 30, 50];

const OPTIONS = {
  type: [
    { value: 'SOCIAL', icon: '🎮', title: '친목형', description: '부담 없이 함께 게임하고 교류해요.' },
    { value: 'COMPETITIVE', icon: '🏆', title: '경쟁형', description: '목표를 세우고 실력을 함께 키워요.' },
  ],
  visibility: [
    { value: 'PUBLIC', icon: '🌐', title: '공개', description: '누구나 찾을 수 있고 가입을 신청할 수 있어요.' },
    { value: 'PRIVATE', icon: '🔒', title: '비공개', description: '검색에 노출되지 않으며 초대로만 가입할 수 있어요.' },
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
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', description: '', game: GAMES[0], maxMembers: 20,
    type: 'SOCIAL', visibility: 'PUBLIC',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.description.trim()) {
      setError('House 이름과 소개를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const house = await createHouse(form, user);
      navigate(`/houses/${house.id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'House를 만들지 못했습니다.');
    } finally {
      setLoading(false);
    }
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
            <span>House 소개 <b>*</b></span>
            <textarea className="inp" maxLength={300}
                      placeholder="어떤 멤버들과 어떤 활동을 하고 싶은지 소개해주세요."
                      value={form.description}
                      onChange={(event) => update('description', event.target.value)} required />
            <small>{form.description.length}/300</small>
          </label>

          <div className="house-select-grid">
            <label className="house-field">
              <span>대표 게임 <b>*</b></span>
              <select className="inp" value={form.game}
                      onChange={(event) => update('game', event.target.value)} required>
                {GAMES.map((game) => <option key={game} value={game}>{game}</option>)}
              </select>
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
          </div>

          <ChoiceGroup label="House 성격" name="type" value={form.type}
                       options={OPTIONS.type} onChange={(value) => update('type', value)} />
          <ChoiceGroup label="공개 설정" name="visibility" value={form.visibility}
                       options={OPTIONS.visibility} onChange={(value) => update('visibility', value)} />

          {form.visibility === 'PRIVATE' && (
            <div className="house-alert">🔒 비공개 House는 가입 신청을 받지 않으며 방장의 초대로만 가입할 수 있습니다.</div>
          )}
          {error && <div className="house-alert error">{error}</div>}

          <div className="house-form-actions">
            <button className="ui-btn-secondary" type="button" onClick={() => navigate(-1)}>취소</button>
            <button className="ui-btn-primary" type="submit" disabled={loading}>
              {loading ? '만드는 중…' : 'House 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
