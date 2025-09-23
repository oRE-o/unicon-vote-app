function LoginRequiredPage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-4xl font-bold">🚫 앗! 안돼요!</h1>
      <p className="text-lg">이 페이지에 접근하려면 로그인이 필요합니다.</p>
      <p className="text-lg"> QR코드를 이용해주세용 :3 </p>
      <p className="text-lg">
        {" "}
        지속적으로 문제가 발생하면 사무국을 찾아주세요!{" "}
      </p>
    </div>
  );
}

export default LoginRequiredPage;
