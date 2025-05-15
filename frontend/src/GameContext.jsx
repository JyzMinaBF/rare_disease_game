/* =========================================================
   GameContext.jsx   –   罕病資源分配遊戲：核心狀態 & 邏輯
   更新時間：2025-05-09 22:10
   覆蓋後請 `npm run dev` 或 Vite 自動熱重載
========================================================= */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from "react";
import axios from "axios";

axios.interceptors.response.use(
  r => r,
  e => { console.error("API Error →", e.config?.url, e.message); return Promise.reject(e); }
);

/* 臨時偵錯 —— 加在檔案最上方 */
const LOG = (...a) => console.log("[GC]", ...a);

async function fetchUniqueStory(round, usedIds, maxTry = 10000) {
  for (let i = 0; i < maxTry; i++) {
    const res = await axios.get(`/api/new_story?round=${round}`);
    if (!res.data || !res.data.id) return null;          // 伺服端已沒故事
    if (!usedIds.includes(res.data.id)) return res.data; // 抽到新故事
  }
  return null;  // 連續抽 maxTry 次都重複 → 視為沒故事
}

/* ---------- 全域常數 ---------- */
export const MAX_ROUNDS = 9;     // 遊戲年度上限
const BASE_BUDGET = 1_600;       // 每年基準預算
const GROWTH_RATE = 0.05;        // 年度預算成長 5 %
const IGNORE_PENALTY = 5;        // 忽略故事扣信任
export const STOP_PENALTY   = 15;        // 停止給付扣信任

/* ---------- 初始狀態 ---------- */
const init = {
  round: 1,
  budget: BASE_BUDGET,
  trust: 40,
  drugs: [],          // 從 API 藥卡
  newStory: null,     // 當年案件
  paying: [],         // 已納入
  defer: [],          // 再議
  expired: [],        // 忽略 / 停止 / 病逝
  usedStoryIds: [],
  loading: true
};

async function fetchBatchUniqueStories(round, usedIds, n = 5) {
  const stories = [];
  const maxLoop = n * 8;          // 給 API 重抽上限，避免死迴圈
  let tries = 0;

  while (stories.length < n && tries < maxLoop) {
    tries++;
    const res = await axios.get(`/api/new_story?round=${round}`);
    if (!res.data || !res.data.id) break;       // 伺服端已無故事
    if (!usedIds.includes(res.data.id) &&
        !stories.find(s => s.id === res.data.id)) {
      stories.push(res.data);
    }
  }
  return stories;
}


/* ---------- React Context ---------- */
const GameContext = createContext();
export const useGame = () => useContext(GameContext);

/* ---------- 把 story 連結藥物 ---------- */
function linkDrug(story, drugs){
  if(!story || !story.drug_id) return null;
  const drugObj = drugs.find(d => d.id === story.drug_id);
  return drugObj ? { ...story, drug: drugObj } : null;
}

/* ---------- Reducer ---------- */
function reducer(s, a){
  switch(a.type){

    /* ===== 初始化資料 ===== */
    case "INIT": {
      LOG("reducer INIT fired");
      const {
        defer = [],
        usedStoryIds = [],
        newStory,
        ...rest
      } = a.payload;

      LOG(newStory)
    
      return {
        ...s,
        ...rest,
        defer,
        usedStoryIds,
        newStory,
        loading: false
      };
    }
    

    /* ===== 設定當年度新案件 ===== */
    case "SET_STORY":
      return {
        ...s,
        newStory: a.story,
        usedStoryIds:
        a.story ? [...s.usedStoryIds, a.story.id] : s.usedStoryIds
        };

    /* ===== 納入健保 ===== */
    case "PAY":{
      const deferOut = s.defer.filter(st => st.id !== a.story.id);
      return {
        ...s,
        budget: s.budget - a.story.drug.cost,
        trust : Math.min(300, s.trust + a.story.trust_gain),
        paying: [...s.paying, a.story],
        defer : deferOut,
        newStory: null
      };
    }

    case "REPAY":{
      const deferOut = s.defer.filter(st => st.id !== a.story.id);
      return {
        ...s,
        budget: s.budget - a.story.drug.cost,
        trust : Math.min(300, s.trust + a.story.trust_gain),
        paying: [...s.paying, a.story],
        defer : deferOut,
      };
    }

    /* ===== 再議 ===== */
    case "DEFER":
      return {
        ...s,
        defer: [...s.defer, { ...a.story, yearsDeferred:0 }],
        newStory:null
      };

    /* ===== 忽略 ===== */
    case "IGNORE":{
      const deferOut = s.defer.filter(st => st.id !== a.story.id);
      return {
        ...s,
        trust : Math.max(0, s.trust - IGNORE_PENALTY),
        defer : deferOut,
        expired: [...s.expired, a.story],
        newStory:null
      };
    }

    /* ===== 停止給付 ===== */
    case "STOP_PAY":
      return {
        ...s,
        trust : Math.max(0, s.trust - STOP_PENALTY),
        paying: s.paying.filter(st => st.id !== a.story.id),
        expired:[...s.expired, a.story],
        budget: s.budget + a.story.drug.cost   // 退回當年預算
      };

    /* ===== 進下一年 ===== */
    case "ADVANCE_ROUND":{
      if(s.round >= MAX_ROUNDS) return s;

      /* 1. 計算新年度基準預算 */
      const newBase = Math.floor(BASE_BUDGET * Math.pow(1+GROWTH_RATE, s.round));
      let budget = newBase;
      let trust  = s.trust;
      let roundMessages = [];
      let trustBefore = trust; 

      /* 2. 扣支付藥費 + 信任加成 */
      s.paying.forEach(st=>{
        budget -= st.drug.cost;
        trust = Math.min(300, trust + st.trust_gain);
      });

      /* 3. 再議患者死亡檢定 */
      const newDefer = s.defer.map(st=>{
        const years = (st.yearsDeferred ?? 0) + 1;
        const p = 1 - Math.pow(1 - st.death_chance, years);
        if(Math.random() < p){
          trust = Math.max(0, trust - st.death_penalty);
          roundMessages.push(
            `${st.drug.name} 的患者不幸等不到支援，信任 -${st.death_penalty}`
          );
          return { ...st, out:true };
        }
        return { ...st, yearsDeferred: years };
      });

      const trustDelta = trust - trustBefore;
      if (trustDelta > 0)
        roundMessages.push(`本回合信任 +${trustDelta}`);

      return {
        ...s,
        round : s.round + 1,
        budget,
        trust,
        defer : newDefer.filter(st => !st.out),
        expired:[...s.expired, ...newDefer.filter(st => st.out)],
        newStory:null,
        lastMessages: roundMessages    // ⬅︎ 新欄位
      };
    }

    default:
      return s;
  }
}

/* ---------- Provider ---------- */
export function GameProvider({children}){
  const [state, dispatch] = useReducer(reducer, init);
  /* ---------- 首次載入：抓藥卡 + 批量 5 張故事 ---------- */
  useEffect(() => {
    (async () => {
      try {
        /* 1. 藥物列表 */
        const drugs = (await axios.get("/api/drugs")).data;

        /* 2. 一次抽 5 張未重複故事 */
        const rawStories = await fetchBatchUniqueStories(1, [], 5);
        const stories = rawStories.map(r => linkDrug(r, drugs)).filter(Boolean);
        console.log(rawStories)

        /* 3. 第一張 → newStory，其餘 4 張 → defer */
        const firstStory = stories[0] || null;
        const initDefer  = stories.slice(1).map(st => ({ ...st, yearsDeferred: 0 }));

        /* 4. 把 5 個 id 全填進 usedStoryIds */
        const initUsedIds = stories.map(s => s.id);

        /* 5. dispatch INIT，帶齊所有欄位！ */
        LOG("dispatch INIT sent, firstStory =", firstStory);
        dispatch({
          type: "INIT",
          payload: {
            drugs,
            newStory: firstStory,
            defer: initDefer,
            usedStoryIds: initUsedIds
          }
        });
      } catch (err) {
        console.error("INIT failed →", err);
      }
    })();
  }, []);

  /* -- 每年抓新故事 -- */
  useEffect(()=>{
    if(state.newStory) return;
    (async ()=>{
        const raw = await fetchUniqueStory(state.round, state.usedStoryIds);
        const story = linkDrug(raw, state.drugs);
        dispatch({ type:"SET_STORY", story });
      })();
  },[state.round, state.loading]);

  /* 可供其他元件使用的藥卡 (依回合解鎖) */
  const availableDrugs = state.drugs.filter(
    d => (d.launch_round ?? 1) <= state.round
  );

  return (
    <GameContext.Provider value={{ state, dispatch, availableDrugs }}>
      {children}
    </GameContext.Provider>
  );
}
