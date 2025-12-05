"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function StatisticsPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine API URL (Hardcoded fallback for local dev stability)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    
    axios.get(`${baseUrl}/api/stats`)
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Stats fetch failed", err);
        setLoading(false);
      });
  }, []);

  const formatLargeNumber = (num: number) => {
    if (!num) return '-';
    if (num >= 1.0e+7) return (num / 1.0e+7).toFixed(2) + " Cr";
    if (num >= 1.0e+5) return (num / 1.0e+5).toFixed(2) + " L";
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Market Statistics</h1>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading Market Data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prev Close</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-green-600">Next Day Pred.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">52W High</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">52W Low</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-xs text-gray-500">{stock.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">₹{stock.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{stock.prevClose}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        ₹{stock.nextDayPrediction}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₹{stock.high52}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">₹{stock.low52}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatLargeNumber(stock.marketCap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}