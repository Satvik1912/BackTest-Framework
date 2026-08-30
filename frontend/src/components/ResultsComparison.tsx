import { JobResult } from "../types"

/** Sortable-at-a-glance overview of every symbol's headline stats. */
export default function ResultsComparison({
  results,
  selected,
  onSelect
}: {
  results: JobResult[]
  selected: string
  onSelect: (symbol: string) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Comparison</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2 text-right">Trades</th>
            <th className="px-3 py-2 text-right">Win Rate</th>
            <th className="px-3 py-2 text-right">Profit Factor</th>
            <th className="px-3 py-2 text-right">Max DD</th>
            <th className="px-3 py-2 text-right">Sharpe</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {results.map((r) => {
            const sym = r.symbol ?? "—"
            const isSel = selected === sym
            return (
              <tr
                key={sym}
                onClick={() => onSelect(sym)}
                className={`cursor-pointer ${isSel ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <td className="px-3 py-2 font-mono font-medium text-gray-900">{sym}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.totalTrades}</td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    r.winRate > 50 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.winRate}%
                </td>
                <td className="px-3 py-2 text-right text-gray-700">{r.profitFactor}</td>
                <td className="px-3 py-2 text-right text-red-600">{r.maxDrawdownPct}%</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.sharpeRatio}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
