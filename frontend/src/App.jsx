/* ----------------------------------------------------
   App.jsx  — 3 個區塊皆採 3×2 Grid 版
---------------------------------------------------- */
import React, { useState } from "react";
import { GameProvider, useGame, MAX_ROUNDS } from "./GameContext";
import axios from "axios";

/* ---------- 小工具 ---------- */
const StatLine = ({ label, value }) => (
  <p className="flex justify-between text-[11px]">
    <span>{label}</span>
    <span>{value}</span>
  </p>
);

/* ---------- 區塊容器 ---------- */
const Section = ({ title, children }) => (
    <section className="mb-8">
      <h2 className="font-heading text-lg font-bold text-primary mb-3">
        {title}
      </h2>
      {children}
    </section>
  );

/* ---------- 已納入支付（可折疊） ---------- */

const PayingCard = ({ story }) => {
  const { dispatch } = useGame();
  const [open, setOpen] = useState(false);

  if (!story?.drug) return null;

  return (
    <div className="border rounded bg-green-50 text-[11px] shadow-sm">
      {/* ▼ 標題列：藥名＋收合箭頭 */}
      <div
        className="flex justify-between px-2 py-1 cursor-pointer font-semibold text-[12px]"
        onClick={() => setOpen(!open)}
      >
        <span>{story.drug.name}</span>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {/* ▼ 展開內容 */}
      {open && (
        <div className="p-2 space-y-1">
          {/* 原始故事文字 */}
          <p className="leading-4">{story.text}</p>

          {/* 基本統計列 */}
          <StatLine label="成本" value={story.drug.cost} />
          <StatLine label="每回合可得信任" value={story.trust_gain} />
          <StatLine label="停付懲罰" value={story.panalty+3} />

          {/* 停止支付按鈕 */}
          <button
            onClick={() => dispatch({ type: "STOP_PAY", story })}
            className="border px-2 py-[1px] rounded text-red-600 mt-1"
          >
            停止支付
          </button>
        </div>
      )}
    </div>
  );
};


/* ---------- 再議卡 ---------- */
const DeferCard = ({ story }) => {
  const { state, dispatch } = useGame();
  if (!story?.drug) return null;
  const [open, setOpen] = useState(false);
  const years = story.yearsDeferred ?? 0;
  const chance = Math.round(
    (1 - Math.pow(1 - story.death_chance, years + 1)) * 100
  );
  const cantPay = state.budget < story.drug.cost;

  return (
    <div className="border rounded bg-yellow-50 text-[11px] shadow-sm">
      <div
        className="flex justify-between px-2 py-1 cursor-pointer font-semibold text-[12px]"
        onClick={() => setOpen(!open)}
      >
        <span>{story.drug.name}</span>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="p-2 space-y-1">
          <p className="leading-4">{story.text}</p>
          <StatLine label="成本" value={story.drug.cost} />
          <StatLine label="納入每回合可得信任" value={story.trust_gain} />
          <StatLine label="停付懲罰" value={story.death_penalty} />
          <StatLine label="延遲年" value={years} />
          <StatLine label="死亡機率" value={chance + "%"} />
          <StatLine label="死亡懲罰" value={story.death_penalty} />
          <div className="space-x-1 mt-1">
            <button
              disabled={cantPay}
              onClick={() => dispatch({ type: "REPAY", story })}
              className={`border px-2 py-[1px] rounded ${
                cantPay && "opacity-40"
              }`}
            >
              納入
            </button>
            <button
              onClick={() => dispatch({ type: "IGNORE", story })}
              className="border px-2 py-[1px] rounded text-red-600"
            >
              忽略
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- 新案件卡 ---------- */
const NewStoryCard = ({ story }) => {
  const { state, dispatch } = useGame();
  if (!story?.drug) return null;
  const [open, setOpen] = useState(true);
  const cantPay = state.budget < story.drug.cost;

  return (
    <div className="border rounded bg-blue-50 text-[11px] shadow-sm">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between px-2 py-1 cursor-pointer font-semibold text-[12px]"
      >
        <span>{story.drug.name}</span>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="p-2 space-y-1">
          <p className="leading-4">{story.text}</p>
          <StatLine label="成本" value={story.drug.cost} />
          <StatLine label="納入每回合可得信任" value={story.trust_gain} />
          <StatLine label="忽略懲罰" value={story.panalty} />
          <StatLine
            label="死亡機率/年"
            value={Math.round(story.death_chance * 100) + "%"}
          />
          <StatLine label="死亡懲罰" value={story.death_penalty} />
          <div className="space-x-1 mt-1">
            <button
              disabled={cantPay}
              onClick={() => dispatch({ type: "PAY", story })}
              className={`border px-3 py-[1px] rounded ${
                cantPay && "opacity-40"
              }`}
            >
              納入
            </button>
            <button
              onClick={() => dispatch({ type: "DEFER", story })}
              className="border px-3 py-[1px] rounded"
            >
              再議
            </button>
            <button
              onClick={() => dispatch({ type: "IGNORE", story })}
              className="border px-3 py-[1px] rounded text-red-600"
            >
              忽略
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- HUD ---------- */
const HUD = () => {
  const { state } = useGame();
  return (
    <div className="mb-6 px-4 py-2 bg-primary text-white rounded-md shadow">
      回合 {state.round}/{MAX_ROUNDS}
      <span className="ml-4">預算 {state.budget.toLocaleString()}</span>
      <span className="ml-4">信任 {state.trust}</span>
    </div>
  );
};

/* ---------- 主頁面 ---------- */
function Game() {
  const { state, dispatch } = useGame();

  /* 在 Game() 函式體內加 */
  React.useEffect(()=>{
    if(state.lastMessages && state.lastMessages.length){
      window.alert(state.lastMessages.join("\n"));
    }
  }, [state.lastMessages]);


  const finish = async () => {
    const payload = {
      qaly: state.paying.length * 10,
      budget_left: state.budget,
      trust: state.trust,
      coverage: state.paying.length,
    };
    await axios.post("/api/score", payload);
    alert("遊戲結算完畢！");
  };

  if (state.loading) return <p className="p-6">載入中…</p>;

  return (
    <div className="max-w-xl mx-auto p-5">
      <HUD />

      {/* 已納入支付 3×2 Grid */}
      <Section title="已納入支付">
        <div className="grid grid-cols-3 gap-4">
          {state.paying.map((st) => (
            <PayingCard key={st.id} story={st} />
          ))}
        </div>
      </Section>

      {/* 再議中 3×2 Grid */}
      <Section title="再議中">
        <div className="grid grid-cols-3 gap-4">
          {state.defer.map((st) => (
            <DeferCard key={st.id} story={st} />
          ))}
        </div>
      </Section>

      {/* 新案件區 3×2 (但通常只有 1 張) */}
      {state.newStory && (
        <Section title="新的患者案件">
          <div className="grid grid-cols-3 gap-4">
            <NewStoryCard story={state.newStory} />
          </div>
        </Section>
      )}

      {/* 下一年／結算 */}
      {state.round < MAX_ROUNDS ? (
        <button
          disabled={!!state.newStory}
          onClick={() => dispatch({ type: "ADVANCE_ROUND" })}
          className="mt-4 w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-40"
        >
          下一年
        </button>
      ) : (
        <button
          onClick={finish}
          className="mt-4 w-full py-2 bg-green-600 text-white rounded"
        >
          結算
        </button>
      )}
    </div>
  );
}

/* ---------- 封裝 Provider ---------- */
export default function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
