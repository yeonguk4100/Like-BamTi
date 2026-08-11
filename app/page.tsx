"use client";

import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  easyName: string;
  emoji: string;
  price: number;
  hotAvailable: boolean;
  iceAvailable: boolean;
};

type Temp = "HOT" | "ICE";
type SizeId = "regular" | "large";
type OrderPlace = "store" | "takeout";
type Step = "menu" | "option" | "orderType" | "confirm" | "payment" | "done";

const COUNT_KEY = "kiosk-practice-count";
const LAST_DATE_KEY = "kiosk-practice-last-date";

// 카페 메뉴 목업 데이터 (외래어에는 쉬운 설명을 함께 적어둔다)
const MENU_ITEMS: MenuItem[] = [
  {
    id: "americano",
    name: "아메리카노",
    easyName: "연한 원두커피",
    emoji: "☕",
    price: 3000,
    hotAvailable: true,
    iceAvailable: true,
  },
  {
    id: "latte",
    name: "카페라떼",
    easyName: "우유를 넣은 부드러운 커피",
    emoji: "🥛",
    price: 3500,
    hotAvailable: true,
    iceAvailable: true,
  },
  {
    id: "cappuccino",
    name: "카푸치노",
    easyName: "우유 거품이 풍성한 커피",
    emoji: "☁️",
    price: 3800,
    hotAvailable: true,
    iceAvailable: true,
  },
  {
    id: "caramel-macchiato",
    name: "카라멜마키아토",
    easyName: "달콤한 카라멜이 들어간 커피",
    emoji: "🍯",
    price: 4500,
    hotAvailable: true,
    iceAvailable: true,
  },
  {
    id: "green-tea-latte",
    name: "녹차라떼",
    easyName: "우유를 넣은 녹차",
    emoji: "🍵",
    price: 4000,
    hotAvailable: true,
    iceAvailable: true,
  },
  {
    id: "strawberry-smoothie",
    name: "딸기스무디",
    easyName: "얼음과 딸기를 갈아 만든 음료",
    emoji: "🍓",
    price: 5000,
    hotAvailable: false,
    iceAvailable: true,
  },
];

const SIZE_OPTIONS: { id: SizeId; label: string; extra: number }[] = [
  { id: "regular", label: "보통 크기", extra: 0 },
  { id: "large", label: "큰 크기 (+500원)", extra: 500 },
];

const STEP_LABEL: Record<Step, string> = {
  menu: "메뉴 고르기",
  option: "온도 · 크기 고르기",
  orderType: "매장 · 포장 고르기",
  confirm: "주문 확인하기",
  payment: "결제하기",
  done: "연습 완료",
};

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function todayString(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function Home() {
  const [step, setStep] = useState<Step>("menu");
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [temp, setTemp] = useState<Temp | null>(null);
  const [size, setSize] = useState<SizeId | null>(null);
  const [orderPlace, setOrderPlace] = useState<OrderPlace | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const [practiceCount, setPracticeCount] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>("");

  useEffect(() => {
    try {
      const savedCount = window.localStorage.getItem(COUNT_KEY);
      const savedDate = window.localStorage.getItem(LAST_DATE_KEY);
      if (savedCount) setPracticeCount(parseInt(savedCount, 10) || 0);
      if (savedDate) setLastDate(savedDate);
    } catch {
      // localStorage를 쓸 수 없어도 연습은 계속할 수 있어야 한다
    }
  }, []);

  const selectedMenu = useMemo(
    () => MENU_ITEMS.find((m) => m.id === selectedMenuId) ?? null,
    [selectedMenuId]
  );

  const sizeInfo = useMemo(
    () => SIZE_OPTIONS.find((s) => s.id === size) ?? null,
    [size]
  );

  const totalPrice = (selectedMenu?.price ?? 0) + (sizeInfo?.extra ?? 0);

  function resetAll() {
    setSelectedMenuId(null);
    setTemp(null);
    setSize(null);
    setOrderPlace(null);
    setIsPaying(false);
    setStep("menu");
  }

  function goBack() {
    if (step === "option") setStep("menu");
    else if (step === "orderType") setStep("option");
    else if (step === "confirm") setStep("orderType");
    else if (step === "payment") setStep("confirm");
  }

  function handlePay() {
    if (isPaying) return;
    setIsPaying(true);
    setTimeout(() => {
      const today = todayString(new Date());
      let nextCount = 1;
      try {
        const savedCount = window.localStorage.getItem(COUNT_KEY);
        const savedDate = window.localStorage.getItem(LAST_DATE_KEY);
        const countSoFar = savedCount ? parseInt(savedCount, 10) || 0 : 0;
        nextCount = countSoFar + 1;
        window.localStorage.setItem(COUNT_KEY, String(nextCount));
        window.localStorage.setItem(LAST_DATE_KEY, today);
        setLastDate(today);
      } catch {
        nextCount = practiceCount + 1;
      }
      setPracticeCount(nextCount);
      setIsPaying(false);
      setStep("done");
    }, 900);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("링크를 복사했어요! 가족에게 보내보세요 💌");
    } catch {
      setCopyStatus(window.location.href);
    }
  }

  const showBack = step !== "menu" && step !== "done";

  return (
    <main style={styles.main}>
      {/* 심리적 안전감 문구 — 모든 단계에서 항상 보임 */}
      <div style={styles.safetyBanner}>
        🙂 연습 중이에요, 편하게 하세요. 몇 번을 눌러도 괜찮아요.
      </div>

      <header style={styles.header}>
        <h1 style={styles.title}>☕ 카페 키오스크 연습</h1>
        <p style={styles.stepLabel}>지금 단계 : {STEP_LABEL[step]}</p>
      </header>

      {step !== "done" && (
        <nav style={styles.navRow}>
          {showBack && (
            <button style={styles.secondaryBtn} onClick={goBack}>
              ← 뒤로 가기
            </button>
          )}
          {step !== "menu" && (
            <button style={styles.secondaryBtn} onClick={resetAll}>
              🔄 처음부터 다시
            </button>
          )}
        </nav>
      )}

      <section style={styles.card}>
        {step === "menu" && (
          <MenuStep
            selectedMenuId={selectedMenuId}
            onSelect={(id) => {
              const m = MENU_ITEMS.find((x) => x.id === id);
              setSelectedMenuId(id);
              setTemp(m?.hotAvailable ? null : "ICE");
              setSize(null);
              setStep("option");
            }}
          />
        )}

        {step === "option" && selectedMenu && (
          <OptionStep
            menu={selectedMenu}
            temp={temp}
            size={size}
            onSelectTemp={setTemp}
            onSelectSize={setSize}
            onNext={() => setStep("orderType")}
          />
        )}

        {step === "orderType" && (
          <OrderTypeStep
            orderPlace={orderPlace}
            onSelect={(v) => {
              setOrderPlace(v);
              setStep("confirm");
            }}
          />
        )}

        {step === "confirm" && selectedMenu && sizeInfo && orderPlace && temp && (
          <ConfirmStep
            menu={selectedMenu}
            temp={temp}
            sizeInfo={sizeInfo}
            orderPlace={orderPlace}
            totalPrice={totalPrice}
            onNext={() => setStep("payment")}
          />
        )}

        {step === "payment" && (
          <PaymentStep
            totalPrice={totalPrice}
            isPaying={isPaying}
            onPay={handlePay}
          />
        )}

        {step === "done" && (
          <DoneStep
            practiceCount={practiceCount}
            lastDate={lastDate}
            copyStatus={copyStatus}
            onCopyLink={handleCopyLink}
            onRestart={resetAll}
          />
        )}
      </section>

      {step !== "done" && (
        <p style={styles.gentleNote}>
          괜찮아요, 다시 눌러보세요. 여기서는 몇 번을 틀려도 아무도 몰라요.
        </p>
      )}
    </main>
  );
}

// ---------- 단계별 화면 컴포넌트 ----------

function MenuStep({
  selectedMenuId,
  onSelect,
}: {
  selectedMenuId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>어떤 음료를 드시겠어요?</h2>
      <p style={styles.helperText}>마음에 드는 음료를 하나 눌러주세요.</p>
      <div className="kiosk-grid-2" style={styles.grid2}>
        {MENU_ITEMS.map((item) => {
          const isSelected = item.id === selectedMenuId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                ...styles.menuCardBtn,
                ...(isSelected ? styles.menuCardBtnSelected : {}),
              }}
            >
              <span style={styles.menuEmoji}>{item.emoji}</span>
              <span style={styles.menuName}>{item.name}</span>
              <span style={styles.menuEasyName}>{item.easyName}</span>
              <span style={styles.menuPrice}>{formatPrice(item.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OptionStep({
  menu,
  temp,
  size,
  onSelectTemp,
  onSelectSize,
  onNext,
}: {
  menu: MenuItem;
  temp: Temp | null;
  size: SizeId | null;
  onSelectTemp: (t: Temp) => void;
  onSelectSize: (s: SizeId) => void;
  onNext: () => void;
}) {
  const canGoNext = temp !== null && size !== null;
  const asksTemp = menu.hotAvailable && menu.iceAvailable;
  return (
    <div>
      <h2 style={styles.sectionTitle}>
        {menu.emoji} {menu.name} —{" "}
        {asksTemp ? "온도와 크기를 골라주세요" : "크기를 골라주세요"}
      </h2>
      {!asksTemp && (
        <p style={styles.helperText}>이 음료는 차가운 음료(ICE)로만 나와요.</p>
      )}

      {asksTemp && (
        <>
          <p style={styles.helperText}>따뜻하게 드릴까요, 차갑게 드릴까요?</p>
          <div className="kiosk-grid-2" style={styles.grid2}>
            <BigOptionButton
              label="HOT — 따뜻한 음료"
              emoji="🔥"
              selected={temp === "HOT"}
              onClick={() => onSelectTemp("HOT")}
            />
            <BigOptionButton
              label="ICE — 차가운 음료"
              emoji="🧊"
              selected={temp === "ICE"}
              onClick={() => onSelectTemp("ICE")}
            />
          </div>
        </>
      )}

      <p style={{ ...styles.helperText, marginTop: asksTemp ? "28px" : "0" }}>
        크기는 어떻게 해드릴까요?
      </p>
      <div className="kiosk-grid-2" style={styles.grid2}>
        {SIZE_OPTIONS.map((s) => (
          <BigOptionButton
            key={s.id}
            label={s.label}
            emoji="🥤"
            selected={size === s.id}
            onClick={() => onSelectSize(s.id)}
          />
        ))}
      </div>

      <div style={styles.nextBtnWrap}>
        <button
          style={{
            ...styles.primaryBtn,
            ...(canGoNext ? {} : styles.disabledBtn),
          }}
          disabled={!canGoNext}
          onClick={onNext}
        >
          다음으로 →
        </button>
      </div>
    </div>
  );
}

function OrderTypeStep({
  orderPlace,
  onSelect,
}: {
  orderPlace: OrderPlace | null;
  onSelect: (v: OrderPlace) => void;
}) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>매장에서 드시나요, 포장해 가시나요?</h2>
      <p style={styles.helperText}>편하신 쪽을 눌러주세요.</p>
      <div className="kiosk-grid-2" style={styles.grid2}>
        <BigOptionButton
          label="매장에서 먹을게요"
          emoji="🍽️"
          selected={orderPlace === "store"}
          onClick={() => onSelect("store")}
        />
        <BigOptionButton
          label="포장해서 갈게요"
          emoji="🥤"
          selected={orderPlace === "takeout"}
          onClick={() => onSelect("takeout")}
        />
      </div>
    </div>
  );
}

function ConfirmStep({
  menu,
  temp,
  sizeInfo,
  orderPlace,
  totalPrice,
  onNext,
}: {
  menu: MenuItem;
  temp: Temp;
  sizeInfo: { label: string; extra: number };
  orderPlace: OrderPlace;
  totalPrice: number;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>주문 내용을 확인해주세요</h2>
      <div style={styles.summaryBox}>
        <SummaryRow label="음료" value={`${menu.emoji} ${menu.name}`} />
        <SummaryRow label="온도" value={temp === "HOT" ? "따뜻하게 (HOT)" : "차갑게 (ICE)"} />
        <SummaryRow label="크기" value={sizeInfo.label} />
        <SummaryRow
          label="이용 방법"
          value={orderPlace === "store" ? "매장에서 먹을게요" : "포장해서 갈게요"}
        />
        <div style={styles.summaryDivider} />
        <SummaryRow label="총 금액" value={formatPrice(totalPrice)} big />
      </div>
      <p style={styles.helperText}>맞으면 아래 버튼을 눌러 결제로 넘어가요.</p>
      <div style={styles.nextBtnWrap}>
        <button style={styles.primaryBtn} onClick={onNext}>
          이대로 주문할게요 →
        </button>
      </div>
    </div>
  );
}

function PaymentStep({
  totalPrice,
  isPaying,
  onPay,
}: {
  totalPrice: number;
  isPaying: boolean;
  onPay: () => void;
}) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>결제해주세요 (가상 결제)</h2>
      <p style={styles.helperText}>
        실제로 돈이 나가지 않아요. 편하게 눌러서 연습해보세요.
      </p>
      <div style={styles.summaryBox}>
        <SummaryRow label="결제 금액" value={formatPrice(totalPrice)} big />
      </div>
      <div style={styles.nextBtnWrap}>
        <button
          style={{ ...styles.primaryBtn, ...(isPaying ? styles.disabledBtn : {}) }}
          disabled={isPaying}
          onClick={onPay}
        >
          {isPaying ? "결제를 확인하고 있어요..." : "💳 결제할게요"}
        </button>
      </div>
    </div>
  );
}

function DoneStep({
  practiceCount,
  lastDate,
  copyStatus,
  onCopyLink,
  onRestart,
}: {
  practiceCount: number;
  lastDate: string | null;
  copyStatus: string;
  onCopyLink: () => void;
  onRestart: () => void;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={styles.doneEmoji}>🎉</p>
      <h2 style={styles.sectionTitle}>주문을 완성했어요!</h2>
      <p style={styles.helperText}>정말 잘하셨어요. 편하게 몇 번이든 다시 해보세요.</p>

      <div style={styles.summaryBox}>
        <SummaryRow label="오늘 연습" value={`${practiceCount}번째 연습을 마쳤어요`} big />
        {lastDate && <SummaryRow label="마지막 연습일" value={lastDate} />}
      </div>

      <div style={styles.nextBtnWrap}>
        <button style={styles.primaryBtn} onClick={onRestart}>
          🔄 또 연습하기
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button style={styles.secondaryBtn} onClick={onCopyLink}>
          🔗 이 연습 링크 복사하기
        </button>
        {copyStatus && <p style={styles.copyStatus}>{copyStatus}</p>}
      </div>
    </div>
  );
}

// ---------- 작은 재사용 컴포넌트 ----------

function BigOptionButton({
  label,
  emoji,
  selected,
  onClick,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.optionBtn,
        ...(selected ? styles.optionBtnSelected : {}),
      }}
    >
      <span style={{ fontSize: "36px" }}>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div style={styles.summaryRow}>
      <span style={styles.summaryLabel}>{label}</span>
      <span style={{ ...styles.summaryValue, ...(big ? styles.summaryValueBig : {}) }}>
        {value}
      </span>
    </div>
  );
}

// ---------- 스타일 (고령자 친화: 큰 글씨 · 고대비 · 넓은 터치 타깃) ----------

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    padding: "0 16px 60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  safetyBanner: {
    width: "100%",
    maxWidth: "640px",
    background: "#fef3c7",
    color: "#78350f",
    textAlign: "center",
    fontSize: "18px",
    fontWeight: 700,
    padding: "14px 16px",
    borderRadius: "0 0 16px 16px",
    marginTop: "0",
  },
  header: {
    textAlign: "center",
    marginTop: "8px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#1f2937",
  },
  stepLabel: {
    marginTop: "8px",
    fontSize: "18px",
    fontWeight: 700,
    color: "#9a3412",
  },
  navRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: "640px",
  },
  card: {
    width: "100%",
    maxWidth: "640px",
    background: "#ffffff",
    border: "2px solid #fde68a",
    borderRadius: "24px",
    padding: "28px 24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: "10px",
    textAlign: "center",
  },
  helperText: {
    fontSize: "18px",
    color: "#57534e",
    textAlign: "center",
    marginBottom: "18px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  menuCardBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "20px 12px",
    minHeight: "150px",
    border: "3px solid #e7e5e4",
    borderRadius: "18px",
    background: "#fffdf7",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  menuCardBtnSelected: {
    border: "3px solid #15803d",
    background: "#ecfdf5",
  },
  menuEmoji: {
    fontSize: "48px",
  },
  menuName: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#1f2937",
  },
  menuEasyName: {
    fontSize: "15px",
    color: "#6b7280",
    textAlign: "center",
  },
  menuPrice: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#9a3412",
    marginTop: "4px",
  },
  optionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "22px 12px",
    minHeight: "120px",
    border: "3px solid #e7e5e4",
    borderRadius: "18px",
    background: "#fffdf7",
    cursor: "pointer",
    fontSize: "19px",
    fontWeight: 700,
    color: "#1f2937",
    fontFamily: "inherit",
  },
  optionBtnSelected: {
    border: "3px solid #15803d",
    background: "#ecfdf5",
    color: "#14532d",
  },
  nextBtnWrap: {
    display: "flex",
    justifyContent: "center",
    marginTop: "28px",
  },
  primaryBtn: {
    minHeight: "64px",
    padding: "16px 40px",
    fontSize: "22px",
    fontWeight: 800,
    color: "#ffffff",
    background: "#15803d",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  disabledBtn: {
    background: "#a7b3ad",
    cursor: "not-allowed",
  },
  secondaryBtn: {
    minHeight: "56px",
    padding: "12px 24px",
    fontSize: "18px",
    fontWeight: 700,
    color: "#374151",
    background: "#ffffff",
    border: "2px solid #9ca3af",
    borderRadius: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  summaryBox: {
    background: "#fff7ed",
    borderRadius: "16px",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    margin: "12px 0",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "12px",
    flexWrap: "wrap",
  },
  summaryLabel: {
    fontSize: "16px",
    color: "#78716c",
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: "19px",
    fontWeight: 800,
    color: "#1f2937",
    textAlign: "right",
  },
  summaryValueBig: {
    fontSize: "26px",
    color: "#9a3412",
  },
  summaryDivider: {
    borderTop: "2px dashed #fbbf24",
    margin: "4px 0",
  },
  doneEmoji: {
    fontSize: "56px",
    marginBottom: "4px",
  },
  gentleNote: {
    maxWidth: "640px",
    fontSize: "17px",
    color: "#57534e",
    textAlign: "center",
  },
  copyStatus: {
    marginTop: "10px",
    fontSize: "16px",
    color: "#15803d",
    fontWeight: 700,
    wordBreak: "break-all",
  },
};
