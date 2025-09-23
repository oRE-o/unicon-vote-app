function AdminRequiredPage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-4xl font-bold">
        🚫 의문의 미소녀가 당신의 길을 막았다!
      </h1>
      <p className="text-lg">
        이 페이지에 접근하려면 160 이상의 레벨이 필요해.
      </p>
      <p className="text-lg">
        몬스터를 잡아 레벨을 올리고 다시 도전해보라구. 후후.
      </p>
    </div>
  );
}

export default AdminRequiredPage;
