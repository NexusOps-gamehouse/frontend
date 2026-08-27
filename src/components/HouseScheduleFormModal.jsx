import { useEffect, useId, useState } from 'react';
import Modal from './Modal';

const toLocalDateTime = (isoValue) => {
  if (!isoValue) return '';
  const rawValue = String(isoValue);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(rawValue)
      && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(rawValue)) {
    return rawValue.slice(0, 16);
  }
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const emptyForm = (game) => ({
  title: '', game: game || '', gameMode: '', startAt: '', description: '', maxParticipants: '5',
});

export default function HouseScheduleFormModal({
  open, schedule, defaultGame, isCrewHouse = false, onClose, onSubmit,
}) {
  const formId = useId();
  const [form, setForm] = useState(() => emptyForm(defaultGame));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const editing = Boolean(schedule) && !isCrewHouse;

  useEffect(() => {
    if (!open) return;
    setForm(schedule ? {
      title: schedule.title,
      game: schedule.game || '',
      gameMode: schedule.gameMode || '',
      startAt: toLocalDateTime(schedule.startAt || schedule.scheduledAt),
      description: schedule.description || '',
      maxParticipants: String(schedule.maxParticipants),
    } : emptyForm(defaultGame));
    setSubmitting(false);
    setError('');
  }, [defaultGame, isCrewHouse, open, schedule]);

  const close = () => {
    if (!submitting) onClose();
  };

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const startDate = new Date(form.startAt);
    const maxParticipants = Number(form.maxParticipants);
    const values = isCrewHouse ? {
      title: form.title.trim(),
      scheduledAt: Number.isNaN(startDate.getTime()) ? '' : form.startAt,
      maxParticipants,
    } : {
      title: form.title.trim(),
      game: form.game.trim(),
      gameMode: form.gameMode.trim(),
      startAt: Number.isNaN(startDate.getTime()) ? '' : form.startAt,
      description: form.description.trim(),
      maxParticipants,
    };
    if (!values.title || !(isCrewHouse ? values.scheduledAt : values.startAt)
        || (!isCrewHouse && (!values.game || !values.gameMode))) {
      setError(isCrewHouse
        ? '제목과 시작 일시를 입력해주세요.'
        : '제목, 게임, 게임 모드, 시작 일시를 모두 입력해주세요.');
      return;
    }
    if (!Number.isInteger(maxParticipants) || maxParticipants < 1) {
      setError('최대 참여 인원은 1명 이상이어야 합니다.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message || '일정을 저장하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={editing ? '게임 일정 수정' : '게임 일정 만들기'} size="lg"
           onClose={close} footer={<>
      <button className="ui-btn-secondary" type="button" disabled={submitting} onClick={close}>취소</button>
      <button className="ui-btn-primary" type="submit" form={formId} disabled={submitting}>
        {submitting ? '저장 중…' : editing ? '수정' : '등록'}
      </button>
    </>}>
      <form id={formId} className="house-schedule-form" onSubmit={submit}>
        <label className="house-field">
          <span>일정 제목 <b>*</b></span>
          <input className="inp" type="text" maxLength={50} required autoFocus value={form.title}
                 onChange={update('title')} placeholder="예: 금요일 21:00 랭크 게임" />
          <small>{form.title.length}/50</small>
        </label>
        <div className="house-schedule-form-grid">
          {!isCrewHouse && (
            <>
              <label className="house-field">
                <span>게임 <b>*</b></span>
                <input className="inp" type="text" maxLength={30} required value={form.game}
                       onChange={update('game')} placeholder="게임 이름" />
              </label>
              <label className="house-field">
                <span>게임 모드 <b>*</b></span>
                <input className="inp" type="text" maxLength={30} required value={form.gameMode}
                       onChange={update('gameMode')} placeholder="예: 솔로 랭크" />
              </label>
            </>
          )}
          <label className="house-field">
            <span>시작 일시 <b>*</b></span>
            <input className="inp" type="datetime-local" required value={form.startAt}
                   onChange={update('startAt')} />
          </label>
          <label className="house-field">
            <span>최대 참여 인원 <b>*</b></span>
            <input className="inp" type="number" min="1" step="1" required value={form.maxParticipants}
                   onChange={update('maxParticipants')} />
          </label>
        </div>
        {!isCrewHouse && (
          <label className="house-field">
            <span>설명</span>
            <textarea className="inp" maxLength={500} value={form.description}
                      onChange={update('description')} placeholder="멤버들이 알아야 할 내용을 입력해주세요" />
            <small>{form.description.length}/500</small>
          </label>
        )}
        {error && <div className="house-alert error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
