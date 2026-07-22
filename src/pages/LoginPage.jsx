import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../assets/gamehouse-logo.png";
import "./LoginPage.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-page">
      <div className="login-card">

        {/* 로고 */}
        <img
          src={logo}
          alt="Game House"
          className="logo"
        />

        {/* 환영 문구 */}
        <h1 className="welcome-title">
          환영합니다!
        </h1>

        <p className="welcome-text">
          친구를 찾으러 오셨군요.
        </p>

        {/* 이메일 */}
        <div className="input-group">
          <Mail size={18} />

          <input
            type="email"
            placeholder="이메일을 입력하세요"
          />
        </div>

        {/* 비밀번호 */}
        <div className="input-group">
          <Lock size={18} />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호를 입력하세요"
          />

          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

        {/* 로그인 버튼 */}
        <button className="login-btn">
          로그인
        </button>

        {/* 하단 메뉴 */}
        <div className="bottom-menu">

          <button type="button">
            회원가입
          </button>

          <span>|</span>

          <button type="button">
            아이디 찾기
          </button>

          <span>|</span>

          <button type="button">
            비밀번호 찾기
          </button>

        </div>

      </div>
    </div>
  );
}
