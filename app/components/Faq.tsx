// 자주 묻는 질문. 강원·경남 지침 Q&A 에 공통으로 실린 문항이다 (app/lib/board.ts).

import { FAQ } from "../lib/board";

export function Faq() {
  return (
    <section className="section section-gray" id="faq">
      <div className="wrap">
        <div className="section-head">
          <h2 className="h-lg">자주 묻는 질문</h2>
          <span className="b-sm subtle right">
            두 시도 지침 Q&amp;A에 공통으로 실린 문항을 바탕으로 구성했습니다
          </span>
        </div>
        {FAQ.map((f, i) => (
          <details className="faq" key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <div className="faq-a">
              <p>{f.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
