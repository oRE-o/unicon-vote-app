import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // 라우터 훅 import
import axios from "axios"; // axios import
import ErrorMessage from "../components/ErrorMessage"; // 1. ErrorMessage 컴포넌트 import
import { API_BASE_URL } from "../api";

function LoginPage() {
  const [userId, setUserId] = useState(""); // UUID
  const [userName, setUserName] = useState("");
  const [clubName, setClubName] = useState(""); // 1. club state 추가
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      } catch (_err) {
        setError("사용자 정보를 불러오는 데 실패했습니다.");
      }
    };

    fetchUserStatus();
  }, [searchParams, navigate]);

  const handleLogin = async () => {
    setError(null);

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        uuid: userId,
        password: password,
      });

      const { token } = response.data;
      localStorage.setItem("authToken", token);

      const decodedPayload = JSON.parse(atob(token.split(".")[1])) as {
        role?: "user" | "admin";
      };

      navigate(decodedPayload.role === "admin" ? "/admin" : "/main");
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "로그인에 실패했습니다.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="order-1 space-y-3 text-center lg:order-1 lg:text-left">
            <div className="badge badge-secondary badge-lg mx-auto w-fit whitespace-nowrap px-4 leading-none lg:mx-0">
              QR 로그인
            </div>
            <h1 className="mx-auto max-w-md text-3xl font-black leading-tight md:max-w-none md:text-4xl lg:mx-0">
              바로 로그인
            </h1>
            <p className="mx-auto max-w-md text-base font-semibold leading-6 text-base-content/90 md:max-w-none md:text-xl lg:mx-0">
              이름 확인 후 비밀번호만 입력하세요.
            </p>
            <p className="mx-auto max-w-xl text-sm leading-6 text-base-content/70 lg:mx-0">
              화면에 보이는 이름이 맞는지 보고, 비밀번호를 입력하면 끝입니다.
            </p>

            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <div className="badge badge-outline h-auto whitespace-nowrap px-4 py-3 leading-none">이름 확인</div>
              <div className="badge badge-outline h-auto whitespace-nowrap px-4 py-3 leading-none">비밀번호 입력</div>
              <div className="badge badge-outline h-auto whitespace-nowrap px-4 py-3 leading-none">바로 입장</div>
            </div>
          </section>

          <section className="order-2 rounded-[2rem] border border-base-300 bg-base-200/90 p-4 shadow-2xl shadow-primary/10 backdrop-blur md:p-6 lg:order-2">
            <div className="mb-4">
              <div className="badge badge-outline inline-flex w-fit max-w-full items-center px-4 leading-none">로그인</div>
              <h2 className="mt-3 text-2xl font-bold">계정을 확인하고 입장하세요</h2>
            </div>

            <fieldset className="fieldset gap-2">
              <label className="label text-sm">이름</label>
              <input
                type="text"
                value={userName}
                className="input input-bordered input-disabled w-full"
                disabled
              />
              <label className="label text-sm">소속 동아리</label>
              <input
                type="text"
                value={clubName || "관람객"}
                className="input input-bordered input-disabled w-full"
                disabled
              />
              <label className="label text-sm">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                required
              />
              {error && <ErrorMessage message={error} />}
              <p className="mt-2 text-sm text-base-content/70">
                정보가 다르면 다시 스캔하거나 운영 인력에게 알려주세요.
              </p>

              <button
                className="btn btn-primary mt-4 w-full"
                onClick={() => void handleLogin()}
                disabled={!password || uuidError || isSubmitting}
              >
                {isSubmitting ? "확인 중..." : "로그인"}
              </button>
            </fieldset>
          </section>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
