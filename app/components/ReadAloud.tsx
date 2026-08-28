// 전화로 읽어 주기 — 상담 전화 중에 담당자가 화면을 보며 그대로 읽는 화면.
//
// 안내문(1면)은 학부모에게 건네는 제품이고, 여기는 그 뒤에 오는 것이다.
// 학부모는 종이를 받고도 전화로 다시 묻는다 — 「그래서 어디로 가면 되죠?」
// 그때 담당자가 표를 눈으로 훑어 옮겨 말하지 않도록, 말할 순서대로 늘어놓는다.
//
// 그래서 표가 아니라 문답이다. 「어디에 신청하나요 — …」 를 그대로 읽으면 답이 된다.
// 판정하는 문장은 넣지 않는다 (설계 원칙 1번). 확인 못 한 항목은 읽기 전에 드러낸다.

"use client";

import { useState } from "react";

import type { Track } from "../lib/data";
import {
  readAloudBlock,
  readAloudText,
  TRACK_LABEL,
  type OfficeContact,
  type ResolvedProgram,
} from "../lib/build-sheet";
import { TRACK_DESC, TRACK_ORDER, type TrackFilter } from "../lib/screen";

export function ReadAloud({
  programs,
  /** 교육청 제도의 문의처. 제도에 번호가 없는 교육청 제도에만 채워진다 */
  office,
  /**
   * 소관 필터를 이 화면이 직접 들고 있을지.
   *
   * 「제도 자세히 보기」 버튼으로 열 때는 켠다 — 전화로 「복지부 쪽만 읽어 드릴게요」가
   * 되어야 한다. 「신청 가능한 지원제도」의 보기 방식으로 들어올 때는 끈다 —
   * 그쪽에는 이미 같은 필터가 있어서 두 개가 겹친다.
   */
  withTrackFilter = false,
}: {
  programs: ResolvedProgram[];
  office?: OfficeContact;
  withTrackFilter?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [track, setTrack] = useState<TrackFilter>("all");

  const counts = TRACK_ORDER.reduce(
    (acc, t) => ({ ...acc, [t]: programs.filter((p) => p.track === t).length }),
    {} as Record<Track, number>
  );

  const shown = track === "all" ? programs : programs.filter((p) => p.track === track);

  async function copy() {
    try {
      await navigator.clipboard.writeText(readAloudText(shown, office));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (programs.length === 0) {
    return <p className="hint">이 조건에 해당하는 제도가 없습니다.</p>;
  }

  /** 제도 한 건 — 문답 묶음 */
  function item(p: ResolvedProgram) {
    const b = readAloudBlock(p, office);
    return (
      <li key={p.id} className="readaloud-item">
        <p className="readaloud-name">
          <span className={`badge ${p.track === "education" ? "badge-primary" : ""}`}>
            {TRACK_LABEL[b.track]}
          </span>
          {b.name}
          {!b.verified && <span className="badge">예시</span>}
        </p>
        <dl className="readaloud-qa">
          {b.lines.map((l, i) => (
            <div
              key={i}
              className={l.caution ? "readaloud-row readaloud-caution" : "readaloud-row"}
            >
              <dt>{l.q}</dt>
              <dd>
                {l.href ? (
                  l.href.startsWith("tel:") ? (
                    <a className="official-link" href={l.href}>
                      {l.a}
                    </a>
                  ) : (
                    <a
                      className="official-link"
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l.a}
                    </a>
                  )
                ) : (
                  l.a
                )}
                {/* 기관 이름과 주소 원문. 담당자가 학부모에게 그대로 읽어 줄 값이다 */}
                {l.sub && <span className="readaloud-sub">{l.sub}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </li>
    );
  }

  /* 「전체」일 때는 소관별로 묶어서 낸다 — 전화로도 「교육청 쪽 3건 먼저 말씀드리면」이
     되어야 한다. 한 소관만 골랐으면 묶을 것이 없으므로 그냥 늘어놓는다. */
  const grouped =
    withTrackFilter &&
    track === "all" &&
    TRACK_ORDER.map((t) => ({ t, list: programs.filter((p) => p.track === t) })).filter(
      (g) => g.list.length > 0
    );

  return (
    <div className="readaloud">
      <div className="readaloud-head">
        <p className="readaloud-lead">
          전화로 확인해 드릴 제도 <strong>{shown.length}건</strong>입니다. 아래 문장을 그대로
          읽어 주시면 됩니다.
        </p>
        <button type="button" className="btn btn-outline btn-sm" onClick={copy}>
          {copied ? "복사했습니다" : "읽어 줄 내용 복사"}
        </button>
      </div>

      {withTrackFilter && (
        <div className="controls">
          <span className="b-sm subtle">부서별로 보기</span>
          <button
            type="button"
            className={`chip chip-filter ${track === "all" ? "chip-on" : ""}`}
            onClick={() => setTrack("all")}
          >
            전체 {programs.length}
          </button>
          {TRACK_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip chip-filter ${track === t ? "chip-on" : ""}`}
              onClick={() => setTrack(t)}
              disabled={counts[t] === 0}
            >
              {TRACK_LABEL[t]} {counts[t]}
            </button>
          ))}
        </div>
      )}

      {grouped ? (
        grouped.map((g) => (
          <div key={g.t} className="readaloud-group">
            <div className="group-head">
              <span className={`badge ${g.t === "education" ? "badge-primary" : ""}`}>
                {TRACK_LABEL[g.t]}
              </span>
              <span className="b-sm subtle">{TRACK_DESC[g.t]}</span>
              <span className="group-count">{g.list.length}건</span>
            </div>
            <ol className="readaloud-list">{g.list.map(item)}</ol>
          </div>
        ))
      ) : (
        <ol className="readaloud-list">{shown.map(item)}</ol>
      )}

      {shown.length === 0 && (
        <p className="hint">고른 부서에 해당하는 제도가 없습니다.</p>
      )}

      <p className="hint">
        자격은 신청처에서 최종 확인합니다. 위 내용은 학부모가 확인해야 할 항목이며, 이 화면은
        자격을 판정하지 않습니다.
      </p>
    </div>
  );
}
