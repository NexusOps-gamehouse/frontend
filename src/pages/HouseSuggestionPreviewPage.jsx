import { useState } from 'react';
import { resetHouseSuggestion } from '../api/houses';
import HouseCreateSuggestionModal from '../components/HouseCreateSuggestionModal';
import RecentFriendsHouseSuggestion from '../components/RecentFriendsHouseSuggestion';
import { useAuth } from '../context/AuthContext';
import './Houses.css';

const PARTY_SUGGESTION_ID = 'dev-preview-party-finished';
const RECENT_SUGGESTION_ID = 'dev-preview-recent-friends';
const PREVIEW_FRIENDS = [
  { id: 'preview-friend-1', nickname: '라일락' },
  { id: 'preview-friend-2', nickname: '티모버섯' },
  { id: 'preview-friend-3', nickname: '한타장인' },
];

export default function HouseSuggestionPreviewPage() {
  const { user } = useAuth();
  const [partyOpen, setPartyOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [message, setMessage] = useState('');

  const reset = async (suggestionId) => {
    await resetHouseSuggestion(suggestionId, user);
    setMessage('닫기 상태를 초기화했습니다. 다시 미리보기를 열 수 있습니다.');
  };

  return (
    <div className="page houses-page">
      <div className="house-form-panel suggestion-preview">
        <span className="house-eyebrow">DEV PREVIEW</span>
        <h1>House 생성 제안 UI</h1>
        <p>이 경로는 개발 환경에서만 열립니다. “나중에” 또는 ESC로 닫은 뒤 반복 노출 방지도 확인할 수 있습니다.</p>
        {message && <div className="house-alert success" role="status">{message}</div>}
        <div className="suggestion-preview-grid">
          <section>
            <h2>게임 종료 후 제안</h2>
            <p>실제 game/party 종료 이벤트가 생기면 participant 목록과 고유 suggestionId를 전달합니다.</p>
            <button className="ui-btn-primary" type="button" onClick={() => setPartyOpen(true)}>미리보기</button>
            <button className="ui-btn-secondary" type="button" onClick={() => reset(PARTY_SUGGESTION_ID)}>닫기 상태 초기화</button>
          </section>
          <section>
            <h2>최근 친구 제안</h2>
            <p>추천 친구를 복수 선택하고 생성 화면으로 전달하는 흐름입니다.</p>
            <button className="ui-btn-primary" type="button" onClick={() => setRecentOpen(true)}>미리보기</button>
            <button className="ui-btn-secondary" type="button" onClick={() => reset(RECENT_SUGGESTION_ID)}>닫기 상태 초기화</button>
          </section>
        </div>
      </div>

      <HouseCreateSuggestionModal open={partyOpen} suggestionId={PARTY_SUGGESTION_ID}
                                  participants={PREVIEW_FRIENDS} onClose={() => setPartyOpen(false)} />
      <RecentFriendsHouseSuggestion open={recentOpen} suggestionId={RECENT_SUGGESTION_ID}
                                    friends={PREVIEW_FRIENDS} onClose={() => setRecentOpen(false)} />
    </div>
  );
}
