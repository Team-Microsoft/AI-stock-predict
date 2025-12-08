// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';

export default function Portfolio() {
  const searchParams = useSearchParams();
  const selectedSymbol = searchParams.get('symbol');

  // If a symbol is passed via URL, use it as the single portfolio item.
  // Otherwise, fallback to an empty state (or the user can add rows manually later).
  const [portfolio, setPortfolio] = useState(
    selectedSymbol 
      ? [{ symbol: selectedSymbol, allocation: 100 }] 
      : [{ symbol: 'TCS.NS', allocation: 50 }, { symbol: 'INFY.NS', allocation: 50 }] // Default fallback if accessed directly
  );
  
  const [investment, setInvestment] = useState(100000);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = 'http://127.0.0.1:5000';

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/portfolio/simulate`, {
        investment,
        portfolio
      });
      setResult(res.data);
    } catch (e) { alert("Simulation failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Portfolio Simulator</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Your Allocation</h3>
          
          {/* List of stocks in portfolio */}
          <div className="mb-6 space-y-2">
            {portfolio.map((stock, idx) => (
              <div key={idx} className="flex justify-between bg-gray-50 p-3 rounded border border-gray-200">
                <span className="font-bold">{stock.symbol}</span>
                <span className="text-blue-600">{stock.allocation}%</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 items-end border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Investment (₹)</label>
              <input type="number" value={investment} onChange={(e) => setInvestment(Number(e.target.value))} className="mt-1 block w-full border p-2 rounded" />
            </div>
            <button onClick={simulate} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
              {loading ? 'Simulating...' : 'Simulate 1-Year Growth'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <h3 className="text-lg font-bold">Simulation Results (1 Year)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Initial</p>
                <p className="text-xl font-bold">₹{result.initialInvestment.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Projected Value</p>
                <p className="text-xl font-bold text-green-600">₹{parseFloat(result.finalValue).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Return</p>
                <p className="text-xl font-bold text-blue-600">{result.totalReturn}</p>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-bold text-sm mb-2">Breakdown</h4>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="p-2 text-left">Stock</th><th className="p-2 text-left">Start</th><th className="p-2 text-left">End</th><th className="p-2 text-left">Return</th></tr></thead>
                <tbody>
                  {result.details.map((d: any) => (
                    <tr key={d.symbol} className="border-t"><td className="p-2">{d.symbol}</td><td className="p-2">₹{d.startPrice}</td><td className="p-2">₹{d.endPrice}</td><td className="p-2 text-green-600">{d.return}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}