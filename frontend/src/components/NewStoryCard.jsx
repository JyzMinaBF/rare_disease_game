export default function NewStoryCard({ story }) {
    const { dispatch } = useGame();
    return (
      <div className="border p-4 rounded bg-yellow-50">
        <h3 className="font-bold">{story.drug.name}</h3>
        <p className="text-xs mb-2">{story.text}</p>
        <div className="flex gap-2 text-sm">
          <button onClick={() => dispatch({ type: "PAY", story })} className="btn-pay">納入</button>
          <button onClick={() => dispatch({ type: "DEFER", story })} className="btn-defer">再議</button>
          <button onClick={() => dispatch({ type: "IGNORE", story })} className="btn-ignore">忽略</button>
        </div>
      </div>
    );
  }
  