// 안내 띠의 삽화.
//
// 파일이 없으면 자리째 사라진다. 발표장에서 깨진 이미지 아이콘이 뜨는 것보다
// 삽화가 없는 편이 낫다 — 이미지는 장식이고, 옆의 제목과 리드 문장이
// 같은 내용을 이미 말한다.
//
// onError 만으로는 부족하다. 서버에서 그려진 <img> 는 hydration 이 끝나기 전에
// 이미 로드를 시도하고, 그때 난 error 는 React 핸들러가 붙기 전이라 놓친다.
// 그래서 마운트 시점에 naturalWidth 로 한 번 더 확인한다.
//
// 넣을 파일 — public/hero-illustration.png

"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/hero-illustration.png";

export function HeroArt() {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    // complete 인데 naturalWidth 가 0 이면 로드에 실패한 것이다
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;

  return (
    <div className="hero-art" aria-hidden="true">
      <img
        ref={ref}
        src={SRC}
        alt=""
        width={720}
        height={540}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
