import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import IDFinderPage from './pages/IDFinderPage';
import PasswordFinderPage from './pages/PasswordFinderPage';
import SurveyPage from './pages/SurveyPage';
import PlayStyleSurveyPage from './pages/PlayStyleSurveyPage';
import ConfirmPage from './pages/ConfirmPage';
import MainPage from './pages/MainPage';
import PostFormPage from './pages/PostFormPage';
import PostDetailPage from './pages/PostDetailPage';
import ApplicantsPage from './pages/ApplicantsPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import MyPage from './pages/MyPage';
import ProfileEditPage from './pages/ProfileEditPage';
import ChatListPage from './pages/ChatListPage';
import FriendsPage from './pages/FriendsPage';
import HousesPage from './pages/HousesPage';
import HouseCreatePage from './pages/HouseCreatePage';
import HouseDetailPage from './pages/HouseDetailPage';
import HouseChatPage from './pages/HouseChatPage';
import HouseSuggestionPreviewPage from './pages/HouseSuggestionPreviewPage';

function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/find-id" element={<IDFinderPage />} />
        <Route path="/find-password" element={<PasswordFinderPage />} />
        <Route path="/signup/survey" element={<SurveyPage />} />
        <Route path="/signup/playstyle" element={<PlayStyleSurveyPage />} />
        <Route path="/signup/confirm" element={<ConfirmPage />} />
        <Route path="/post/new" element={<Private><PostFormPage /></Private>} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/post/:id/edit" element={<Private><PostFormPage /></Private>} />
        <Route path="/post/:id/applicants" element={<ApplicantsPage />} />
        <Route path="/profile/:id" element={<Private><ProfilePage /></Private>} />
        <Route path="/chat" element={<Private><ChatListPage /></Private>} />
        <Route path="/chat/:roomId" element={<Private><ChatPage /></Private>} />
        <Route path="/friends" element={<Private><FriendsPage /></Private>} />
        <Route path="/houses" element={<HousesPage />} />
        <Route path="/houses/new" element={<Private><HouseCreatePage /></Private>} />
        <Route path="/houses/:houseId" element={<HouseDetailPage />} />
        <Route path="/houses/:houseId/chat" element={<Private><HouseChatPage /></Private>} />
        {import.meta.env.DEV && (
          <Route path="/houses/suggestions/preview" element={<HouseSuggestionPreviewPage />} />
        )}
        <Route path="/mypage" element={<Private><MyPage /></Private>} />
        <Route path="/mypage/edit" element={<Private><ProfileEditPage /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
