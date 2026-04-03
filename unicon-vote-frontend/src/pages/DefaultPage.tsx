import React from "react";
import SplitText from "../components/reactbits/SplitText";

const DefaultPage: React.FC = () => {
  return (
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
        className="text-xl font-semibold text-center"
        delay={400}
        duration={2}
        ease="elastic.out"
        splitType="words"
        from={{ opacity: 0, y: 10 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}
      />
      <SplitText
        text="사무국에서 수령한 QR코드를 이용해 투표 시스템을 이용하실 수 있습니다 :3"
        className="text-xl font-semibold text-center"
        delay={40}
        duration={2}
        ease="elastic.out"
        splitType="chars"
        from={{ opacity: 0, y: 10 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}
      />
    </div>
  );
};

export default DefaultPage;
