import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createHouseSchedule,
  deleteHouseSchedule,
  joinHouseSchedule,
  leaveHouseSchedule,
  listHouseSchedules,
  updateHouseSchedule,
  updateScheduleAttendance,
} from '../api/houses';
import HouseScheduleFormModal from './HouseScheduleFormModal';
import Modal from './Modal';

const ROLE_LABEL = { OWNER: '방장', MANAGER: '부방장', MEMBER: '일반 멤버' };
const MANAGER_ROLES = ['OWNER', 'MANAGER'];
const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit',
});
const CREATED_DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'numeric', day: 'numeric',
});

const dateValue = (value) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatDate = (value, formatter = DATE_FORMAT) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '일시 정보 없음' : formatter.format(date);
};

export default function HouseSchedulesSection({ house, user, onSuccess }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [attendanceWorking, setAttendanceWorking] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const isCrewHouse = ['PUBLIC', 'PRIVATE'].includes(house.type);
  const canManage = MANAGER_ROLES.includes(house.myRole ?? house.myStatus);
  // Crew API는 승인된 멤버 누구나 일정을 만들 수 있다. 기존 mock House의
  // 수정/삭제 권한과는 분리해, legacy 화면의 관리자 정책은 그대로 유지한다.
  const isApprovedMember = ['OWNER', 'MANAGER', 'MEMBER'].includes(house.myRole)
    && house.myStatus === 'APPROVED';
  const canCreate = isCrewHouse ? isApprovedMember : canManage;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSchedules(await listHouseSchedules(house.id, user, isCrewHouse));
      return true;
    } catch (err) {
      setSchedules([]);
      setError(err.message || '게임 일정을 불러오지 못했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [house.id, house.type, isCrewHouse, user]);

  useEffect(() => { load(); }, [load]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: schedules.filter((schedule) => dateValue(schedule.startAt) >= now)
        .sort((a, b) => dateValue(a.startAt) - dateValue(b.startAt)),
      past: schedules.filter((schedule) => dateValue(schedule.startAt) < now)
        .sort((a, b) => dateValue(b.startAt) - dateValue(a.startAt)),
    };
  }, [schedules]);

  const save = async (values) => {
    if (isCrewHouse && editor?.schedule) {
      throw new Error('Crew API는 일정 수정을 지원하지 않습니다.');
    }
    if (editor?.schedule) {
      const saved = await updateHouseSchedule(house.id, editor.schedule.id, values, user);
      setSchedules((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    } else {
      const saved = await createHouseSchedule(house.id, values, user, isCrewHouse);
      if (isCrewHouse) {
        const reloaded = await load();
        if (!reloaded) throw new Error('일정 목록을 새로고침하지 못했습니다.');
      } else {
        setSchedules((prev) => [...prev, saved]);
      }
    }
    setEditor(null);
    onSuccess(editor?.schedule ? '게임 일정을 수정했습니다.' : '게임 일정을 등록했습니다.');
  };

  const closeDelete = () => {
    if (deleting) return;
    setScheduleToDelete(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteHouseSchedule(house.id, scheduleToDelete.id, user);
      setSchedules((prev) => prev.filter((item) => item.id !== scheduleToDelete.id));
      setScheduleToDelete(null);
      onSuccess('게임 일정을 삭제했습니다.');
    } catch (err) {
      setDeleteError(err.message || '게임 일정을 삭제하지 못했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const changeAttendance = async (schedule, status) => {
    if (attendanceWorking) return;
    setAttendanceWorking(schedule.id);
    setAttendanceError('');
    try {
      if (isCrewHouse) {
        if (schedule.joined) {
          await leaveHouseSchedule(house.id, schedule.id);
          const reloaded = await load();
          if (!reloaded) throw new Error('일정 목록을 새로고침하지 못했습니다.');
          onSuccess('일정 참여를 취소했습니다.');
        } else {
          await joinHouseSchedule(house.id, schedule.id);
          const reloaded = await load();
          if (!reloaded) throw new Error('일정 목록을 새로고침하지 못했습니다.');
          onSuccess('일정에 참여했습니다.');
        }
        return;
      }
      const updated = await updateScheduleAttendance(house.id, schedule.id, status, user);
      setSchedules((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      const selectedAgain = schedule.myAttendance === status;
      onSuccess(selectedAgain ? '일정 참여 선택을 취소했습니다.'
        : status === 'JOINED' ? '일정에 참여합니다.' : '일정에 불참합니다.');
    } catch (err) {
      setAttendanceError(err.message || '참여 상태를 변경하지 못했습니다.');
    } finally {
      setAttendanceWorking('');
    }
  };

  const renderSchedule = (schedule, isPast) => {
    const participantCount = isCrewHouse ? schedule.participantCount : schedule.participants.length;
    const joined = isCrewHouse ? schedule.joined : schedule.myAttendance === 'JOINED';
    const full = participantCount >= schedule.maxParticipants;
    const working = attendanceWorking === schedule.id;
    return (
      <article className="house-schedule-card" key={schedule.id}>
        <div className="house-schedule-head">
          <div>
            <div className="house-schedule-tags">
              <span className="ui-tag">{isPast ? '지난 일정' : '예정 일정'}</span>
              {!isCrewHouse && <span className="ui-tag house-game">🎯 {schedule.game}</span>}
              {!isCrewHouse && <span className="ui-tag">{schedule.gameMode}</span>}
            </div>
            <h4>{schedule.title}</h4>
            <time dateTime={schedule.startAt}>{formatDate(schedule.startAt)}</time>
          </div>
          {canManage && !isCrewHouse && (
            <div className="house-notice-actions">
              <button className="house-role-btn" type="button"
                      onClick={() => setEditor({ schedule })}>수정</button>
              <button className="house-remove-btn" type="button" onClick={() => {
                setScheduleToDelete(schedule);
                setDeleteError('');
              }}>삭제</button>
            </div>
          )}
        </div>
        {!isCrewHouse && schedule.description && <p className="house-schedule-description">{schedule.description}</p>}
        {!isCrewHouse && (
          <div className="house-schedule-info">
            <span>생성자 <strong>{schedule.creator?.nickname || 'House 멤버'}</strong> ({ROLE_LABEL[schedule.creator?.role] || '일반 멤버'})</span>
            <span>생성 {formatDate(schedule.createdAt, CREATED_DATE_FORMAT)}</span>
            {schedule.updatedAt && (
              <span className="house-notice-edited">수정 {formatDate(schedule.updatedAt, CREATED_DATE_FORMAT)}</span>
            )}
          </div>
        )}
        <div className="house-schedule-attendees">
          <strong>참여 예정 {participantCount}/{schedule.maxParticipants}명</strong>
          {isCrewHouse ? (
            schedule.participantUserIds.length > 0 ? (
              <div>{schedule.participantUserIds.map((userId) => <span key={userId}>사용자 #{userId}</span>)}</div>
            ) : <small>아직 참여 예정인 멤버가 없습니다.</small>
          ) : schedule.participants.length > 0 ? (
            <div>{schedule.participants.map((participant) => <span key={participant.id}>{participant.nickname}</span>)}</div>
          ) : <small>아직 참여 예정인 멤버가 없습니다.</small>}
        </div>
        <div className="house-schedule-attendance-actions" aria-label={`${schedule.title} 참여 여부`}>
          {isCrewHouse ? (
            <button className={joined ? 'ui-btn-primary' : 'ui-btn-secondary'}
                    type="button" disabled={Boolean(attendanceWorking) || (full && !joined)}
                    aria-pressed={joined} onClick={() => changeAttendance(schedule)}>
              {working ? '처리 중…' : joined ? '참여 취소' : full ? '참여 마감' : '참여'}
            </button>
          ) : (
            <>
              <button className={schedule.myAttendance === 'JOINED' ? 'ui-btn-primary' : 'ui-btn-secondary'}
                      type="button" disabled={Boolean(attendanceWorking) || (full && schedule.myAttendance !== 'JOINED')}
                      aria-pressed={schedule.myAttendance === 'JOINED'}
                      onClick={() => changeAttendance(schedule, 'JOINED')}>
                {working ? '처리 중…' : schedule.myAttendance === 'JOINED' ? '참여 취소' : full ? '참여 마감' : '참여'}
              </button>
              <button className={schedule.myAttendance === 'DECLINED' ? 'ui-btn-primary' : 'ui-btn-secondary'}
                      type="button" disabled={Boolean(attendanceWorking)} aria-pressed={schedule.myAttendance === 'DECLINED'}
                      onClick={() => changeAttendance(schedule, 'DECLINED')}>
                {working ? '처리 중…' : schedule.myAttendance === 'DECLINED' ? '불참 취소' : '불참'}
              </button>
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="house-schedules-section">
      <div className="house-section-head">
        <h2>게임 일정</h2><span>{schedules.length}건</span>
        {canCreate && (
          <button className="ui-btn-primary ui-btn-sm house-section-action" type="button"
                  onClick={() => setEditor({ schedule: null })}>+ 일정 만들기</button>
        )}
      </div>
      {loading && <div className="ui-empty"><p>게임 일정을 불러오는 중…</p></div>}
      {!loading && error && (
        <div className="house-notice-error" role="alert">
          <p>{error}</p>
          <button className="ui-btn-secondary ui-btn-sm" type="button" onClick={load}>다시 시도</button>
        </div>
      )}
      {!loading && !error && attendanceError && (
        <div className="house-alert error" role="alert">{attendanceError}</div>
      )}
      {!loading && !error && schedules.length === 0 && (
        <div className="ui-empty"><p>등록된 게임 일정이 없습니다.</p></div>
      )}
      {!loading && !error && schedules.length > 0 && (
        <div className="house-schedule-groups">
          <section>
            <h3>예정 일정 <span>{upcoming.length}</span></h3>
            {upcoming.length > 0 ? upcoming.map((schedule) => renderSchedule(schedule, false))
              : <div className="ui-empty house-schedule-empty"><p>예정된 게임 일정이 없습니다.</p></div>}
          </section>
          <section>
            <h3>지난 일정 <span>{past.length}</span></h3>
            {past.length > 0 ? past.map((schedule) => renderSchedule(schedule, true))
              : <div className="ui-empty house-schedule-empty"><p>지난 게임 일정이 없습니다.</p></div>}
          </section>
        </div>
      )}

      <HouseScheduleFormModal open={Boolean(editor)} schedule={editor?.schedule} defaultGame={house.game}
                              isCrewHouse={isCrewHouse}
                              onClose={() => setEditor(null)} onSubmit={save} />
      <Modal open={Boolean(scheduleToDelete)} title="게임 일정 삭제" size="sm"
             onClose={closeDelete} footer={<>
        <button className="ui-btn-secondary" type="button" disabled={deleting} onClick={closeDelete}>취소</button>
        <button className="house-danger-btn" type="button" disabled={deleting} onClick={confirmDelete}>
          {deleting ? '삭제 중…' : '삭제'}
        </button>
      </>}>
        <div className="house-danger-copy">
          <div aria-hidden="true">⚠️</div>
          <p><strong>{scheduleToDelete?.title}</strong> 일정을 삭제할까요?</p>
          <small>참여·불참 정보도 함께 삭제되며 다시 복구할 수 없습니다.</small>
        </div>
        {deleteError && <div className="house-alert error" role="alert">{deleteError}</div>}
      </Modal>
    </section>
  );
}
