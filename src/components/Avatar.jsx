import { assetUrl } from '../config';

export default function Avatar({
  user,
  size = '',
}) {
  return (
    <div className={`av ${size}`}>
      {user?.profileImageUrl
        ? (
          <img
            src={assetUrl(user.profileImageUrl)}
            alt={user.nickname}
          />
        )
        : (
          user?.nickname?.[0] || '?'
        )}
    </div>
  );
}