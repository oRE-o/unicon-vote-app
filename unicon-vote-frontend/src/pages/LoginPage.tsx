import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // 라우터 훅 import
import axios from "axios"; // axios import
import SplitText from "../components/reactbits/SplitText";
import ErrorMessage from "../components/ErrorMessage"; // 1. ErrorMessage 컴포넌트 import

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // 환경변수에서 API_BASE_URL 읽기

function LoginPage() {
  const [userId, setUserId] = useState(""); // UUID
  const [userName, setUserName] = useState("");
  const [clubName, setClubName] = useState(""); // 1. club state 추가
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uuidError, setUuidError] = useState(false); // UUID 관련 에러 상태
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const uuid = searchParams.get("uuid");

    if (!uuid) {
      setError("잘못된 접근입니다. 유효한 QR코드를 이용해주세요.");
      setUuidError(true);
      return;
    }

    const fetchUserStatus = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/auth/status/${uuid}`
        );
        const { name, club, isFirstAccess } = response.data; // 2. club 정보 받기

        // 만약 첫 접속 사용자라면, 비밀번호 설정 페이지로 보냄
        if (isFirstAccess) {
          navigate(`/signup?uuid=${uuid}`);
          return;
        }
        setUserId(uuid);
        setUserName(name);
        if (club) setClubName(club); // 3. state에 club 정보 저장
      } catch (err) {
        setError("사용자 정보를 불러오는 데 실패했습니다.");
      }
    };

    fetchUserStatus();
  }, [searchParams, navigate]);

  const handleLogin = async () => {
    // async 키워드 추가
    setError(null);

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        uuid: userId,
        password: password,
      });

      // 3. 로그인 성공 시 서버가 보내준 토큰(JWT)을 저장
      const { token } = response.data;
      localStorage.setItem("authToken", token); // localStorage에 토큰 저장

      alert(`${userName}님, 환영합니다!`);
      navigate("/main"); // 로그인 후 게임 목록 페이지 등으로 이동
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "로그인에 실패했습니다.";
      setError(errorMessage);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-3 p-4">
        <SplitText
          text="Vote@UNICON!"
          className="text-5xl font-bold text-center p-1"
          delay={50}
          duration={2}
          ease="elastic.out"
          splitType="chars"
          from={{ opacity: 0, y: 20 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
        />
        <SplitText
          text="당신의 갓겜, UNICON의 갓겜."
          className="text-xl font-semibold text-center "
          delay={400}
          duration={2}
          ease="elastic.out"
          splitType="words"
          from={{ opacity: 0, y: 10 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
        />

        {/* card 대신 fieldset 구조 사용 */}
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          {/* h2 대신 legend 태그로 제목 표시 */}
          <legend className="fieldset-legend px-2 text-xl font-bold">
            로그인
          </legend>

          <label className="label">User ID</label>
          <input
            type="text"
            value={userId}
            className="input input-bordered input-disabled"
            disabled
          />
          <label className="label">이름</label>
          <input
            type="text"
            value={userName}
            className="input input-bordered input-disabled"
            disabled
          />
          <label className="label">소속 동아리</label>
          <input // 4. club 정보 표시 input 추가
            type="text"
            value={clubName || "관람객"}
            className="input input-bordered input-disabled"
            disabled
          />
          <label className="label">비밀번호</label>
          <input
            type="password"
            placeholder="••••••••"
            className="input input-bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // Enter 키로 로그인 가능하도록 추가
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            required
          />
          {error && <ErrorMessage message={error} />}

          <button
            className="btn btn-neutral mt-4"
            onClick={handleLogin}
            disabled={!password || uuidError}
          >
            로그인
          </button>
        </fieldset>
      </div>
    </>
  );
}

export default LoginPage;
