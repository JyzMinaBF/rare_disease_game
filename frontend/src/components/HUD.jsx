import React from "react";
import { useGame } from "@/GameContext";

export default function HUD() {
  const { state } = useGame();
  return (
    <div className="mb-3 flex justify-between text-sm">
      <span>回合 {state.round}/12</span>
      <span>預算 {state.budget}</span>
      <span>信任 {state.trust}</span>
    </div>
  );
}
