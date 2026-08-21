// 알림 마당 · 서식 자료실.
//
// 공지와 파일 목록은 화면 구성을 위한 가상 데이터다 (app/lib/board.ts).
// 나중에 교육청 게시판을 붙일 자리다.

import { FILES, NOTICES } from "../lib/board";

export function NoticeBoard() {
  return (
    <section className="section wrap" id="notice-board">
      <div className="section-head">
        <h2 className="h-lg">알림 마당</h2>
        <span className="b-sm subtle right">지침 개정과 서식 변경을 여기서 알립니다</span>
      </div>

      <div className="board-grid">
        <div className="board">
          <div className="board-head">
            <h3>공지사항</h3>
            <span className="board-more">전부 가상 데이터입니다</span>
          </div>
          <ul className="board-list">
            {NOTICES.map((b) => (
              <li key={b.title}>
                <a href="#notice-board">
                  <span className="board-tag">{b.tag}</span>
                  <span className="board-title">{b.title}</span>
                  {b.isNew && <span className="board-new">N</span>}
                  <span className="board-date">{b.date}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="board" id="forms">
          <div className="board-head">
            <h3>서식 자료실</h3>
            <span className="board-more">전부 가상 파일입니다</span>
          </div>
          <div className="board-list">
            <div className="file-grid">
              {FILES.map((f) => (
                <div className="file" key={f.name}>
                  <span className="file-ic">{f.ext}</span>
                  <span>
                    <span className="file-name">{f.name}</span>
                    <br />
                    <span className="file-meta">{f.meta}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
