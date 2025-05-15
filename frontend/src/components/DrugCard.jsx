import React from "react";
import { useGame } from "@/GameContext";

export default function DrugCard({ drug }) {
  const { state, dispatch } = useGame();
  const owned = (state.given || {})[drug.id];
  const disabled = owned || state.budget < drug.cost;

  return (
    <div
      onClick={() => !disabled && dispatch({ type: "PAY", drug })}
      className={`p-3 border rounded cursor-pointer select-none
                 ${owned ? "bg-green-200" : "hover:bg-blue-50"}`}
    >
      <h3 className="font-bold text-sm">{drug.name}</h3>
      <p className="text-xs">{drug.disease}</p>
      <p className="text-[11px] mt-1">成本: {drug.cost}</p>
    </div>
  );
}
