import React, { useState, useEffect } from "react";
import api from "../api"; // 우리가 만든 axios 클라이언트
import type { Game } from "../types";
import { QRCodeSVG } from "qrcode.react"; // QR 코드 라이브러리 import
import Modal from "../components/Modal"; // 모달 컴포넌트 재사용

// 임시 User 타입
interface User {
  _id: string;
  name: string;
  uuid: string;
  role: string;
  club?: string;
}

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);

  const [qrModalUuid, setQrModalUuid] = useState<string | null>(null); // QR 모달 state
  // --- 폼 입력을 위한 State 확장 ---
  const [newUser, setNewUser] = useState({ name: "", role: "guest", club: "" });
  const [newGame, setNewGame] = useState({
    name: "",
    description: "",
    imageUrl: "",
    developers: "",
  });

  const fetchUsers = async () => {
    const usersRes = await api.get("/api/admin/users");
    setUsers(usersRes.data);
  };

  const fetchGames = async () => {
    const gamesRes = await api.get("/api/games");
    setGames(gamesRes.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchGames();
  }, []);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUser.name.trim()) return;
    try {
      await api.post("/api/admin/users", newUser);
      setNewUser({ name: "", role: "guest", club: "" }); // 폼 초기화
      await fetchUsers(); // 목록 새로고침
    } catch (error) {
      console.error("사용자 생성 실패:", error);
      alert("사용자 생성에 실패했습니다.");
    }
  };
  const handleResetPassword = async (uuid: string) => {
    if (
      window.confirm(
        "정말 이 사용자의 비밀번호를 초기화하시겠습니까?\n초기화 후에는 QR코드로 다시 접속하여 비밀번호를 설정해야 합니다."
      )
    ) {
      try {
        await api.patch(`/api/admin/users/${uuid}/reset-password`);
        alert("비밀번호가 초기화되었습니다.");
      } catch (error) {
        console.error("비밀번호 초기화 실패:", error);
        alert("비밀번호 초기화에 실패했습니다.");
      }
    }
  };

  const showQrCode = (uuid: string) => {
    setQrModalUuid(uuid);
  };

  const handleDeleteUser = async (uuid: string) => {
    if (window.confirm("정말 이 사용자를 삭제하시겠습니까?")) {
      try {
        await api.delete(`/api/admin/users/${uuid}`);
        await fetchUsers(); // 목록 새로고침
      } catch (error) {
        console.error("사용자 삭제 실패:", error);
        alert("사용자 삭제에 실패했습니다.");
      }
    }
  };

  const handleAddGame = async (event: React.FormEvent) => {
    event.preventDefault();
    // developers 필드가 비어있는지 확인
    if (!newGame.name.trim() || !newGame.developers.trim()) {
      alert("게임 이름과 개발자 목록은 필수입니다.");
      return;
    }
    try {
      // 쉼표로 구분된 문자열을 배열로 변환
      const developersArray = newGame.developers
        .split(",")
        .map((dev) => dev.trim())
        .filter((dev) => dev);

      // 👇 API 호출 시 developers 배열을 전송
      await api.post("/api/admin/games", {
        ...newGame,
        developers: developersArray,
      });

      // 폼 초기화 (club 대신 developers 필드 사용)
      setNewGame({ name: "", description: "", imageUrl: "", developers: "" });
      await fetchGames();
    } catch (error) {
      console.error("게임 추가 실패:", error);
      alert("게임 추가에 실패했습니다.");
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (window.confirm("정말 이 게임을 삭제하시겠습니까?")) {
      try {
        await api.delete(`/api/admin/games/${id}`);
        await fetchGames(); // 목록 새로고침
      } catch (error) {
        console.error("게임 삭제 실패:", error);
        alert("게임 삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">관리자 대시보드</h1>

      {/* 사용자 관리 섹션 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">사용자 관리</h2>
        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 p-4 border rounded-lg bg-base-200"
        >
          <input
            type="text"
            placeholder="새 사용자 이름"
            className="input input-bordered"
            required
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <select
            className="select select-bordered"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="guest">guest</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <input
            type="text"
            placeholder="소속 동아리 (선택)"
            className="input input-bordered"
            value={newUser.club}
            onChange={(e) => setNewUser({ ...newUser, club: e.target.value })}
          />
          <button type="submit" className="btn btn-primary">
            사용자 생성
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>이름</th>
                <th>소속 동아리</th>
                <th>역할</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.club || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        user.role === "admin" ? "badge-secondary" : ""
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  {/* --- 👇 중첩된 <td> 태그 오류 수정 --- */}
                  <td className="flex flex-wrap gap-2">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => showQrCode(user.uuid)}
                    >
                      QR 보기
                    </button>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleResetPassword(user.uuid)}
                    >
                      비번 초기화
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => handleDeleteUser(user.uuid)}
                    >
                      삭제
                    </button>
                  </td>
                  {/* --- 👆 수정 끝 --- */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- 게임 관리 섹션 개선 --- */}
      <section>
        <h2 className="text-2xl font-bold mb-4">게임 관리</h2>
        <form
          onSubmit={handleAddGame}
          className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 p-4 border rounded-lg bg-base-200"
        >
          <input
            type="text"
            placeholder="게임 이름"
            className="input input-bordered"
            required
            value={newGame.name}
            onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="게임 설명"
            className="input input-bordered"
            value={newGame.description}
            onChange={(e) =>
              setNewGame({ ...newGame, description: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="이미지 URL"
            className="input input-bordered"
            value={newGame.imageUrl}
            onChange={(e) =>
              setNewGame({ ...newGame, imageUrl: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="개발자 목록 (쉼표로 구분, 예: Club_이름)" // placeholder 변경
            className="input input-bordered"
            required
            value={newGame.developers} // state 이름 변경
            onChange={(e) =>
              setNewGame({ ...newGame, developers: e.target.value })
            }
          />
          <button type="submit" className="btn btn-primary">
            게임 추가
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>게임 이름</th>
                <th>소속 동아리</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game._id}>
                  <td>{game.name}</td>
                  {/* 👇 developers 배열을 쉼표로 연결하여 표시 */}
                  <td>{game.developers.join(", ")}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => handleDeleteGame(game._id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={!!qrModalUuid}
        onClose={() => setQrModalUuid(null)}
        title="사용자 로그인 QR 코드"
      >
        {qrModalUuid && (
          <div className="flex flex-col items-center gap-4">
            <QRCodeSVG
              value={`${window.location.origin}/login?uuid=${qrModalUuid}`}
              size={256}
            />
            <p className="text-sm text-center">
              이 QR코드를 스캔하여 로그인 페이지로 접속할 수 있습니다.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminPage;
