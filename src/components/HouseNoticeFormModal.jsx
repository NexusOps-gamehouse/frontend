import { useEffect, useId, useState } from 'react';
import Modal from './Modal';

const EMPTY_FORM = { title: '', content: '' };

export default function HouseNoticeFormModal({ open, notice, onClose, onSubmit }) {
  const formId = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const editing = Boolean(notice);

  useEffect(() => {
    if (!open) return;
    setForm(notice ? { title: notice.title, content: notice.content } : EMPTY_FORM);
    setSubmitting(false);
    setError('');
  }, [notice, open]);

  const close = () => {
    if (!submitting) onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const values = { title: form.title.trim(), content: form.content.trim() };
    if (!values.title || !values.content) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message || '공지를 저장하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={editing ? '공지 수정' : '공지 작성'} onClose={close} footer={<>
      <button className="ui-btn-secondary" type="button" disabled={submitting} onClick={close}>취소</button>
      <button className="ui-btn-primary" type="submit" form={formId} disabled={submitting}>
        {submitting ? '저장 중…' : editing ? '수정' : '등록'}
      </button>
    </>}>
      <form id={formId} className="house-notice-form" onSubmit={submit}>
        <label className="house-field">
          <span>제목 <b>*</b></span>
          <input className="inp" type="text" maxLength={50} required autoFocus
                 value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                 placeholder="공지 제목을 입력해주세요" />
          <small>{form.title.length}/50</small>
        </label>
        <label className="house-field">
          <span>내용 <b>*</b></span>
          <textarea className="inp" maxLength={1000} required value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="House 멤버에게 전할 내용을 입력해주세요" />
          <small>{form.content.length}/1000</small>
        </label>
        {error && <div className="house-alert error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
