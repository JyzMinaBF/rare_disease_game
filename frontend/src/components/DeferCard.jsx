<p className="text-xs">已延遲 {st.yearsDeferred} 年，死亡機率 {(1 - Math.pow(1-st.death_chance, st.yearsDeferred+1))*100|0}%</p>
