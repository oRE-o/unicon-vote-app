import { useMemo } from "react";

function AdminRequiredPage() {
  const reason = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("reason");
  }, []);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-4xl font-bold">🚫 이 페이지는 지금 열 수 없어요.</h1>
      <p className="text-lg">
        {reason === "expired"
          ? "세션이 만료되어 다시 인증이 필요합니다."
          : "현재 계정으로는 이 페이지에 접근할 수 없습니다."}
      </p>
      <p className="text-sm opacity-70">필요한 계정으로 다시 로그인한 뒤 이용해주세요.</p>
    </div>
  );
}

export default AdminRequiredPage;
