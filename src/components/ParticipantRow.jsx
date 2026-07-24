import { Link } from 'react-router-dom';
import { profileFromUser } from '../api/riot';
import RiotProfileCard from './RiotProfileCard';

/**
 * 모집글 참가자 한 줄. user는 UserDto.
 * 라이엇을 매번 호출하지 않고 가입 때 저장해둔 값을 쓴다.
 * (참가자 5명짜리 글 10개면 실시간 조회는 라이엇 호출 200번이라 개발 키로는 불가)
 */
export default function ParticipantRow({ user, host = false }) {
  if (!user) return null;

  const profile = profileFromUser(user);
  const traits = [
    user.position,
    user.playStyle,
    user.mic == null ? null : user.mic ? '마이크 O' : '마이크 X',
  ].filter(Boolean);

  return (
    <div className="flex" style={{ gap: 12, padding: '10px 0' }}>
      <div className="av">
        {user.profileImageUrl ? <img src={user.profileImageUrl} alt="" /> : (user.nickname?.[0] ?? '?')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex" style={{ gap: 6 }}>
          <span className="name">{user.nickname}</span>
          {host && <span className="tag">방장</span>}
        </div>
        {traits.length > 0 && <div className="meta" style={{ marginTop: 2 }}>{traits.join(' · ')}</div>}
        {profile
          ? <div style={{ marginTop: 6 }}><RiotProfileCard profile={profile} variant="compact" /></div>
          : <div className="meta" style={{ marginTop: 6 }}>게임 계정 미연동</div>}
      </div>

      {profile && <Link className="textlink" to={`/users/${user.id}`}>프로필</Link>}
    </div>
  );
}
