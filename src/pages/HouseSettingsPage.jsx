import { useCallback, useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getHouse, updateHouse } from '../api/houses';
import { GAMES } from '../constants';
import { useAuth } from '../context/AuthContext';
import './Houses.css';

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
            <input type="radio" name={name} value={option.value} checked={value === option.value}
                   onChange={() => onChange(option.value)} />
            <span className="house-choice-icon" aria-hidden="true">{option.icon}</span>
            <span><strong>{option.title}</strong><small>{option.description}</small></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const settingsFromHouse = (house) => ({
  name: house.name,
  description: house.description,
  game: house.game,
  maxMembers: Number(house.maxMembers),
  type: house.type,
  visibility: house.visibility,
});

const normalizedSettings = (form) => form && ({
  name: form.name.trim(),
  description: form.description.trim(),
  game: form.game,
  maxMembers: Number(form.maxMembers),
  type: form.type,
  visibility: form.visibility,
});

export default function HouseSettingsPage() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [house, setHouse] = useState(null);
  const [initialSettings, setInitialSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setAccessDenied(false);
    try {
      const data = await getHouse(houseId, user);
      if (['PUBLIC', 'PRIVATE'].includes(data.type)) {
        setAccessDenied(true);
        setError('Crew House 설정은 아직 실제 API에 연결되지 않았습니다.');
        return;
      }
      if (data.myRole !== 'OWNER') {
        setAccessDenied(true);
        setError('방장만 House 설정을 관리할 수 있습니다.');
        return;
      }
      const values = normalizedSettings(settingsFromHouse(data));
      setHouse(data);
      setInitialSettings(values);
      setForm(values);
    } catch (err) {
      if (err.code === 'PRIVATE_HOUSE') setAccessDenied(true);
      setError(err.message || 'House 설정을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [houseId, user]);

  useEffect(() => { load(); }, [load]);

  const values = useMemo(() => normalizedSettings(form), [form]);
  const changed = Boolean(values && initialSettings
    && JSON.stringify(values) !== JSON.stringify(initialSettings));

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (values.name.length < 2 || values.name.length > 30) return 'House 이름은 2자 이상 30자 이하로 입력해주세요.';
    if (values.description.length < 10 || values.description.length > 300) return 'House 소개는 10자 이상 300자 이하로 입력해주세요.';
    if (!GAMES.includes(values.game)) return '대표 게임을 선택해주세요.';
    if (!Number.isInteger(values.maxMembers) || values.maxMembers < 2 || values.maxMembers > 100) {
      return '최대 인원은 2명 이상 100명 이하의 정수로 입력해주세요.';
    }
    if (values.maxMembers < house.members.length) {
      return `현재 멤버 수(${house.members.length}명)보다 최대 인원을 줄일 수 없습니다.`;
    }
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving || !changed) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateHouse(houseId, values, user);
      navigate(`/houses/${houseId}`, {
        replace: true,
        state: { houseSettingsNotice: 'House 설정을 저장했습니다.' },
      });
    } catch (err) {
      setError(err.message || 'House 설정을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page houses-page"><div className="ui-empty"><p>House 설정을 불러오는 중…</p></div></div>
  );

  if (accessDenied) return (
    <div className="page houses-page">
      <div className="ui-empty house-private-error">
        <div className="house-lock" aria-hidden="true">🔒</div>
        <h1>House 설정에 접근할 수 없습니다</h1>
        <p>{error || '방장만 House 설정을 관리할 수 있습니다.'}</p>
        <Link className="ui-btn-secondary house-empty-link" to={`/houses/${houseId}`}>House 상세로</Link>
      </div>
    </div>
  );

  if (!house || !form) return (
    <div className="page houses-page">
      <div className="ui-empty house-private-error">
        <h1>House 설정을 불러오지 못했습니다</h1>
        <p>{error || '잠시 후 다시 시도해주세요.'}</p>
        <div className="house-settings-retry-actions">
          <Link className="ui-btn-secondary" to="/houses">House 목록으로</Link>
          <button className="ui-btn-primary" type="button" onClick={load}>다시 시도</button>
        </div>
      </div>
    </div>
  );

  const pendingPrivateChange = house.visibility === 'PUBLIC'
    && form.visibility === 'PRIVATE' && house.joinRequests?.length > 0;

  return (
    <div className="page houses-page">
      <div className="house-form-panel">
        <div className="house-form-head">
          <span className="house-eyebrow">HOUSE SETTINGS</span>
          <h1>House 설정</h1>
          <p>House 정보와 가입 방식을 관리합니다. 설정은 방장만 변경할 수 있습니다.</p>
        </div>
        <form onSubmit={submit}>
          <label className="house-field">
            <span>House 이름 <b>*</b></span>
            <input className="inp" type="text" minLength={2} maxLength={30} required value={form.name}
                   onChange={(event) => update('name', event.target.value)} />
            <small>{form.name.length}/30</small>
          </label>
          <label className="house-field">
            <span>House 소개 <b>*</b></span>
            <textarea className="inp" minLength={10} maxLength={300} required value={form.description}
                      onChange={(event) => update('description', event.target.value)} />
            <small>{form.description.length}/300</small>
          </label>
          <div className="house-select-grid">
            <label className="house-field">
              <span>대표 게임 <b>*</b></span>
              <select className="inp" required value={form.game}
                      onChange={(event) => update('game', event.target.value)}>
                {GAMES.map((game) => <option key={game} value={game}>{game}</option>)}
              </select>
            </label>
            <label className="house-field">
              <span>최대 인원 <b>*</b></span>
              <input className="inp" type="number" min="2" max="100" step="1" required
                     value={form.maxMembers}
                     onChange={(event) => update('maxMembers', event.target.value)} />
              <small>현재 멤버 {house.members.length}명 · 2~100명</small>
            </label>
          </div>
          <ChoiceGroup label="House 성격" name="type" value={form.type}
                       options={OPTIONS.type} onChange={(value) => update('type', value)} />
          <ChoiceGroup label="공개 설정" name="visibility" value={form.visibility}
                       options={OPTIONS.visibility} onChange={(value) => update('visibility', value)} />

          {form.visibility === 'PRIVATE' && (
            <div className="house-alert">🔒 비공개 House는 가입 신청을 받지 않으며 방장의 초대로만 가입할 수 있습니다.</div>
          )}
          {pendingPrivateChange && (
            <div className="house-alert error" role="alert">대기 중인 가입 신청을 먼저 승인하거나 거절해주세요.</div>
          )}
          {error && <div className="house-alert error" role="alert">{error}</div>}

          <div className="house-form-actions">
            <button className="ui-btn-secondary" type="button" disabled={saving}
                    onClick={() => navigate(`/houses/${houseId}`)}>취소</button>
            <button className="ui-btn-primary" type="submit" disabled={saving || !changed}>
              {saving ? '저장 중…' : '설정 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
