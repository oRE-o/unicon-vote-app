import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage"; // 1. ErrorMessage 컴포넌트 import
import { API_BASE_URL } from "../api";

function SignUpPage() {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [initialNameFromServer, setInitialNameFromServer] = useState<
    string | null
  >(null); // --- ✨ 1. 서버에서 받은 '원본' 이름 저장 (null 가능) ---
  const [userRole, setUserRole] = useState(""); // 1. role state 추가
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uuidError, setUuidError] = useState(false); // UUID 관련 에러 상태
  const navigate = useNavigate(); // 페이지 이동을 위한 훅
  const [searchParams] = useSearchParams(); // URL 쿼리 파라미터를 읽기 위한 훅
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [welcomeMessage2, setWelcomeMessage2] = useState(
    "새로운 계정을 만들어 시작해보세요."
  );

  useEffect(() => {
    const uuid = searchParams.get("uuid"); // URL에서 'uuid' 파라미터 추출 (예: /signup?uuid=...)

    if (!uuid) {
      setError("잘못된 접근입니다. 유효한 QR코드를 이용해주세요.");
      setUuidError(true);
      setWelcomeMessage("뭔가 이상해요!");
      setWelcomeMessage2("유효한 QR코드를 이용해주세요.");
      return;
    }

    const fetchUserStatus = async () => {
      // URL 접속 시 바로 사용자 상태를 서버에서 확인
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/auth/status/${uuid}`
        );
        const { name: fetchedName, role, isFirstAccess } = response.data;

        if (!isFirstAccess) {
          // 이미 등록된 사용자라면 로그인 페이지로 보냄
          navigate(`/login?uuid=${uuid}`);
          return;
        }

        setUserId(uuid);
        setInitialNameFromServer(fetchedName); // 서버 원본 이름 저장
        setUserRole(role); // 2. role state 설정
        if (role === "guest" && !fetchedName) {
          // 역할이 guest이고 서버에 이름이 없으면 -> "관람객"으로 시작 & 수정 가능
          setUserName("관람객");
          setWelcomeMessage("방문객님, 환영해요!");
          setWelcomeMessage2("이름과 비밀번호를 설정해주세요.");
        } else {
          // 역할이 guest가 아니거나, guest라도 서버에 이름이 있으면 -> 서버 이름 사용 & 수정 불가
          setUserName(fetchedName || "이름 없음"); // 혹시 모를 null 대비
          setWelcomeMessage(`${fetchedName || "방문객"}님, 환영해요!`);
        }
      } catch (_err) {
        setError("사용자 정보를 불러오는 데 실패했습니다.");
      }
    };

    fetchUserStatus();
  }, [searchParams, navigate]);

  const handleSignUp = async () => {
    setError(null);

    if (password.length < 4) {
      setError("비밀번호는 최소 4자리 이상이어야 합니다.");
      return;
    }
    // 2. 기존 비밀번호 일치 여부 검사
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      setIsSubmitting(true);
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        uuid: userId,
        password: password,
        name: userName,
      });

      navigate(`/login?uuid=${userId}`);
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  const isNameInputDisabled =
    userRole !== "guest" || (userRole === "guest" && !!initialNameFromServer);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="order-1 space-y-3 text-center lg:order-1 lg:text-left">
            <div className="badge badge-secondary badge-lg mx-auto w-fit whitespace-nowrap px-4 leading-none lg:mx-0">
              첫 설정
            </div>
            <h1 className="mx-auto max-w-md text-3xl font-black leading-tight md:max-w-none md:text-4xl lg:mx-0">
              {welcomeMessage}
            </h1>
            <p className="mx-auto max-w-md text-base font-semibold leading-6 text-base-content/90 md:max-w-none md:text-xl lg:mx-0">
              {welcomeMessage2}
            </p>
            <p className="mx-auto max-w-xl text-sm leading-6 text-base-content/70 lg:mx-0">
              처음 한 번만 설정하면 다음부터는 비밀번호만 입력하면 됩니다.
            </p>

            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <div className="badge badge-outline h-auto whitespace-nowrap px-4 py-3 leading-none">이름 확인</div>
              <div className="badge badge-outline h-auto whitespace-nowrap px-4 py-3 leading-none">비밀번호 설정</div>
              <div className="badge badge-outline h-auto whitespace-nowrap px-4 py-3 leading-none">공정하게 참여</div>
            </div>
          </section>

          <section className="order-2 rounded-[2rem] border border-base-300 bg-base-200/90 p-4 shadow-2xl shadow-primary/10 backdrop-blur md:p-6 lg:order-2">
            <div className="mb-4">
              <div className="badge badge-outline inline-flex w-fit max-w-full items-center px-4 leading-none">회원 설정</div>
              <h2 className="mt-3 text-2xl font-bold">처음 한 번만 설정하면 준비 완료예요</h2>
              <p className="mt-2 text-sm text-base-content/70">비밀번호는 4자리 이상으로 입력해주세요.</p>
            </div>

            <fieldset className="fieldset gap-2">
              <label className="label mt-1 text-sm">이름</label>
              <input
                type="text"
                placeholder={userName}
                className="input input-bordered w-full"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isNameInputDisabled}
              />

              <label className="label mt-1 text-sm">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label className="label mt-1 text-sm">비밀번호 확인</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <label className="label mt-3 cursor-pointer justify-start gap-3 rounded-2xl bg-base-100/70 px-4 py-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="label-text text-sm leading-6">
                  UNICON을 즐겁게 체험하고 공정하게 투표하겠습니다.
                </span>
              </label>

              {error && <ErrorMessage message={error} />}

              <p className="text-sm text-base-content/70">
                정보가 이상하거나 진행이 막히면 운영 인력에게 도움을 요청해주세요.
              </p>

              <button
                onClick={() => void handleSignUp()}
                className="btn btn-primary mt-4 mb-1 w-full"
                disabled={
                  !agreed || !password || !confirmPassword || uuidError || isSubmitting
                }
              >
                {isSubmitting ? "설정 중..." : "회원 설정 완료"}
              </button>
            </fieldset>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
