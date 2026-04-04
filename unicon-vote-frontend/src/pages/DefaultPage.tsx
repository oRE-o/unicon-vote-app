import React from "react";
import SplitText from "../components/reactbits/SplitText";
import { QRCodeSVG } from "qrcode.react";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const demoAccounts = [
  {
    label: "기명 사용자",
    name: "김메이커",
    description: "기명 사용자 첫 설정 후 일반 사용자 투표 흐름 확인용",
    uuid: "11111111-aaaa-1111-aaaa-111111111111",
  },
  {
    label: "무기명 사용자",
    name: "방문객-테스트",
    description: "무기명 guest 첫 설정 흐름 확인용",
    uuid: "88888888-8888-8888-8888-888888888888",
  },
];

const DefaultPage: React.FC = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-5 text-center lg:text-left">
            <div className="badge badge-secondary badge-lg mx-auto w-fit whitespace-nowrap px-4 leading-none lg:mx-0">
              UNICON 현장 투표
            </div>
            <SplitText
              text="Vote@UNICON!"
              className="text-4xl font-black text-center leading-tight md:text-6xl lg:text-left"
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
              className="text-lg font-semibold text-center text-base-content/90 md:text-2xl lg:text-left"
              delay={400}
              duration={2}
              ease="elastic.out"
              splitType="words"
              from={{ opacity: 0, y: 10 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
            />
            <p className="mx-auto max-w-xl text-sm leading-7 text-base-content/70 md:text-base lg:mx-0">
              행사장에서 받은 팔찌 QR을 스캔하면 바로 로그인 또는 첫 설정 화면으로
              이동합니다. 복잡한 회원가입 없이, 게임을 즐긴 뒤 가장 인상 깊었던
              작품에 메달을 주세요.
            </p>
            <div className="grid gap-3 text-left sm:grid-cols-3">
              <div className="rounded-3xl border border-base-300 bg-base-200/80 p-4 shadow-lg shadow-black/10">
                <p className="text-sm font-semibold">1. QR 스캔</p>
                <p className="mt-1 text-xs leading-6 text-base-content/70">
                  팔찌 QR로 바로 접속합니다.
                </p>
              </div>
              <div className="rounded-3xl border border-base-300 bg-base-200/80 p-4 shadow-lg shadow-black/10">
                <p className="text-sm font-semibold">2. 간단 로그인</p>
                <p className="mt-1 text-xs leading-6 text-base-content/70">
                  첫 접속이면 비밀번호만 설정하면 됩니다.
                </p>
              </div>
              <div className="rounded-3xl border border-base-300 bg-base-200/80 p-4 shadow-lg shadow-black/10">
                <p className="text-sm font-semibold">3. 메달 투표</p>
                <p className="mt-1 text-xs leading-6 text-base-content/70">
                  네 가지 기준으로 금·은·동 메달을 줄 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-base-300 bg-base-200/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="space-y-4 rounded-[1.5rem] border border-base-300 bg-base-100/80 p-5">
              <div className="badge badge-outline w-fit whitespace-nowrap px-4 leading-none">이용 안내</div>
              <h2 className="text-2xl font-bold">QR이 준비되어 있다면 바로 시작할 수 있어요.</h2>
              <ul className="space-y-3 text-sm leading-6 text-base-content/70">
                <li>• 사무국에서 받은 팔찌 QR을 카메라로 스캔해주세요.</li>
                <li>• 이미 비밀번호가 있으면 로그인 화면이 바로 열립니다.</li>
                <li>• 처음이라면 이름 확인 후 비밀번호만 정하면 됩니다.</li>
              </ul>
              <div className="rounded-2xl bg-primary/10 p-4 text-sm leading-6 text-primary-content/90">
                QR이 보이지 않거나 접속이 잘 안 되면 현장 운영 인력에게 바로 도움을
                요청해주세요.
              </div>

              {isDemoMode && (
                <div className="space-y-4 rounded-[1.5rem] border border-secondary/30 bg-secondary/10 p-5">
                  <div>
                    <div className="badge badge-secondary w-fit whitespace-nowrap px-4 leading-none">demo quick access</div>
                    <h3 className="mt-3 text-xl font-bold">
                      테스트용 기명/무기명 계정을 바로 열어볼 수 있어요.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-base-content/70">
                      local lab 에서만 보이는 카드예요. 링크를 누르거나 QR을 스캔해 서로 다른
                      사용자 화면을 빠르게 확인할 수 있습니다.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {demoAccounts.map((account) => {
                      const loginUrl = `${origin}/login?uuid=${account.uuid}`;

                      return (
                        <div
                          key={account.uuid}
                          className="rounded-[1.25rem] border border-base-300 bg-base-100/90 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                                {account.label}
                              </p>
                              <h4 className="mt-1 text-lg font-bold">{account.name}</h4>
                              <p className="mt-2 text-sm leading-6 text-base-content/70">
                                {account.description}
                              </p>
                            </div>
                            <QRCodeSVG value={loginUrl} size={84} />
                          </div>

                          <a className="btn btn-secondary mt-4 w-full" href={loginUrl}>
                            이 계정으로 열기
                          </a>
                          <p className="mt-2 break-all text-xs text-base-content/60">
                            {loginUrl}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DefaultPage;
