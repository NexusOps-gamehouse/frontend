import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

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
import ChatListPage from './pages/ChatListPage';
import ChatPreviewPage from './pages/ChatPreviewPage';

import FriendsPage from './pages/FriendsPage';

import MyPage from './pages/MyPage';
import ProfileEditPage from './pages/ProfileEditPage';

import HousesPage from './pages/HousesPage';
import HouseCreatePage from './pages/HouseCreatePage';
import HouseDetailPage from './pages/HouseDetailPage';
import HouseChatPage from './pages/HouseChatPage';
import HouseSettingsPage from './pages/HouseSettingsPage';
import HouseSuggestionPreviewPage from './pages/HouseSuggestionPreviewPage';

import CustomizationShopPage from './pages/CustomizationShopPage';
import MyCustomizationPage from './pages/MyCustomizationPage';

function Private({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  return user ? children : (
    <Navigate
      to="/login"
      replace
      state={{
        from: `${location.pathname}${location.search}`,
      }}
    />
  );
}

export default function App() {
  return (
    <>
      <NavBar />

      <Routes>
        {/* =========================
            Main
        ========================= */}

        <Route
          path="/"
          element={<MainPage />}
        />

        {/* =========================
            Authentication
        ========================= */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/find-id"
          element={<IDFinderPage />}
        />

        <Route
          path="/find-password"
          element={<PasswordFinderPage />}
        />

        <Route
          path="/signup/survey"
          element={<SurveyPage />}
        />

        <Route
          path="/signup/playstyle"
          element={<PlayStyleSurveyPage />}
        />

        <Route
          path="/signup/confirm"
          element={<ConfirmPage />}
        />

        {/* =========================
            Posts
        ========================= */}

        <Route
          path="/post/new"
          element={
            <Private>
              <PostFormPage />
            </Private>
          }
        />

        <Route
          path="/post/:id"
          element={<PostDetailPage />}
        />

        <Route
          path="/post/:id/edit"
          element={
            <Private>
              <PostFormPage />
            </Private>
          }
        />

        <Route
          path="/post/:id/applicants"
          element={<ApplicantsPage />}
        />

        {/* =========================
            Profile
        ========================= */}

        <Route
          path="/profile/:id"
          element={
            <Private>
              <ProfilePage />
            </Private>
          }
        />

        {/* =========================
            Chat
        ========================= */}

        <Route
          path="/chat"
          element={
            <Private>
              <ChatListPage />
            </Private>
          }
        />

        <Route
          path="/chat/preview"
          element={
            import.meta.env.DEV ? (
              <Private>
                <ChatPreviewPage />
              </Private>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/chat/:roomId"
          element={
            <Private>
              <ChatPage />
            </Private>
          }
        />

        {/* =========================
            Friends
        ========================= */}

        <Route
          path="/friends"
          element={
            <Private>
              <FriendsPage />
            </Private>
          }
        />

        {/* =========================
            House
        ========================= */}

        <Route
          path="/houses"
          element={<HousesPage />}
        />

        <Route
          path="/houses/new"
          element={
            <Private>
              <HouseCreatePage />
            </Private>
          }
        />

        <Route
          path="/houses/:houseId"
          element={<HouseDetailPage />}
        />

        <Route
          path="/houses/:houseId/chat"
          element={
            <Private>
              <HouseChatPage />
            </Private>
          }
        />

        <Route
          path="/houses/:houseId/settings"
          element={
            <Private>
              <HouseSettingsPage />
            </Private>
          }
        />

        {/* 개발 환경 전용 House 생성 제안 Preview */}
        {import.meta.env.DEV && (
          <Route
            path="/houses/suggestions/preview"
            element={<HouseSuggestionPreviewPage />}
          />
        )}

        {/* =========================
            Customization
        ========================= */}

        <Route
          path="/customization"
          element={
            <Private>
              <MyCustomizationPage />
            </Private>
          }
        />

        <Route
          path="/customization/shop"
          element={
            <Private>
              <CustomizationShopPage />
            </Private>
          }
        />

        {/* =========================
            My Page
        ========================= */}

        <Route
          path="/mypage"
          element={
            <Private>
              <MyPage />
            </Private>
          }
        />

        <Route
          path="/mypage/edit"
          element={
            <Private>
              <ProfileEditPage />
            </Private>
          }
        />

        {/* =========================
            Fallback
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </>
  );
}
