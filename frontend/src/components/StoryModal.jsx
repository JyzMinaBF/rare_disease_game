import React from "react";
import { useGame } from "@/GameContext";

export default function StoryModal() {
  const { state, dispatch } = useGame();
  const s = state.currentStory;
  if (!s) return null;

  const drug = state.drugs.find(d => d.id === s.drug_id);
  const canPay = state.budget >= drug.cost && !(state.given || {})[drug.id];
  ;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-80">
        <h2 className="font-semibold mb-2">患者故事</h2>
        <p className="text-sm mb-4">{s.text}</p>

        {canPay ? (
          <div className="flex justify-end gap-2">
            <button onClick={() => dispatch({ type: "FAIL", penalty: s.penalty })}
                    className="px-3 py-1 border rounded">跳過</button>
            <button onClick={() => dispatch({ type: "PAY", drug })}
                    className="px-3 py-1 bg-blue-600 text-white rounded">支付</button>
          </div>
        ) : (
          <p className="text-red-600 text-center">無法支付</p>
        )}
      </div>
    </div>
  );
}
