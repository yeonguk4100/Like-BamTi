// 3단계 — 학부모용 안내문.
//
// 기본 서식은 규칙이 만든 것이고, AI 버튼을 누르면 서버가 규칙을 다시 돌린 결과로
// 문장을 바꿔 온다. AI 호출이 실패해도 기본 서식은 그대로 남는다.

export function LetterPanel({
  letter,
  isAi,
  aiStatus,
  aiError,
  copied,
  onCopy,
  onRewrite,
  onReset,
}: {
  letter: string;
  isAi: boolean;
  aiStatus: "idle" | "loading" | "error";
  aiError: string;
  copied: boolean;
  onCopy: () => void;
  onRewrite: () => void;
  onReset: () => void;
}) {
  return (
    <section className="panel letter" id="step3">
      <div className="panel-head">
        <h3 className="h-sm">3. 학부모용 안내문</h3>
        <button type="button" className="btn btn-outline btn-sm right" onClick={onCopy}>
          {copied ? "복사했습니다" : "복사하기"}
        </button>
      </div>
      <div className="panel-body">
        <div className="ai-bar">
          <span className={`badge ${isAi ? "badge-primary" : ""}`}>
            {isAi ? "AI가 다시 씀" : "기본 서식"}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onRewrite}
            disabled={aiStatus === "loading"}
          >
            {aiStatus === "loading" ? "쓰고 있습니다…" : "AI로 쉽게 다시 쓰기"}
          </button>
          {isAi && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onReset}
            >
              기본 서식으로
            </button>
          )}
        </div>

        {aiStatus === "error" && (
          <p className="ai-error">{aiError} 아래 기본 서식은 그대로 쓸 수 있습니다.</p>
        )}

        <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
          출력해서 건네거나 문자로 보냅니다. AI로 보낼 때{" "}
          <strong>생년월일·상세 메모·발신 정보는 보내지 않습니다.</strong>
        </p>

        <pre className="letter-body">{letter}</pre>
      </div>
    </section>
  );
}
