import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import Avatar from '../components/Avatar';
import { csv, profileTags, profileMeta } from '../utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get(`/users/${id}`)
      .then(({ data }) => setProfile(data))
      .catch((err) => {
        alert(errMsg(err));
        navigate(-1);
      });
  }, [id, navigate]);

  if (!profile) return null;

  return (
    <div className="page">
      <div className="center">
        <p className="h2">프로필</p>
        <div className="card">
          <div className="flex" style={{ marginBottom: 12 }}>
            <Avatar user={profile} size="lg" />
            <div>
              <div className="name">
                {profile.nickname}{' '}
                <span className={`dot ${profile.online ? '' : 'off'}`} />
                <span className="meta"> {profile.online ? '온라인' : '오프라인'}</span>
              </div>
              <div className="meta">{profileMeta(profile)}</div>
            </div>
          </div>
          <div className="row">
            {profileTags(profile).map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
          <div className="meta" style={{ lineHeight: 1.9 }}>
            {csv(profile.gameModes).length > 0 && <div>주 게임 모드: {csv(profile.gameModes).join(', ')}</div>}
            {csv(profile.playTimes).length > 0 && <div>주 플레이 시간대: {csv(profile.playTimes).join(', ')}</div>}
            {profile.riotNickname && <div>롤 닉네임: {profile.riotNickname}</div>}
          </div>
        </div>
        <button className="btn2" style={{ marginTop: 8 }} onClick={() => navigate(-1)}>뒤로</button>
      </div>
    </div>
  );
}
