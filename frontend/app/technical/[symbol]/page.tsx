// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function TechnicalAnalysis() {
  const { symbol } = useParams();
  const [data, setData] = useState<any>(null);
  const baseUrl = 'http://127.0.0.1:5000';

  useEffect(() => {
    if (symbol) {
      axios.get(`${baseUrl}/api/technical/${symbol}`)
        .then(res => setData(res.data))
        .catch(err => console.error(err));
    }
  }, [symbol]);

  if (!data) return <div className="p-8 text-center">Loading Technicals...</div>;

  const rsiData = {
    labels: data.history.map((h: any) => h.date.split('T')[0]),
    datasets: [{
      label: 'RSI',
      data: data.history.map(() => parseFloat(data.rsi)), // Mock historical for demo view, real endpoint gives snapshot
      borderColor: 'purple',
      borderWidth: 2
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Technical Analysis: {String(symbol)}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-gray-500 text-sm font-bold uppercase">RSI (14)</h3>
            <p className="text-2xl font-bold mt-2 text-purple-600">{data.rsi}</p>
            <p className="text-xs text-gray-400 mt-1">{data.rsi > 70 ? 'Overbought' : data.rsi < 30 ? 'Oversold' : 'Neutral'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-gray-500 text-sm font-bold uppercase">MACD</h3>
            <p className="text-2xl font-bold mt-2 text-blue-600">{data.macd.value}</p>
            <p className="text-xs text-gray-400 mt-1">Signal: {data.macd.signal}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-gray-500 text-sm font-bold uppercase">Bollinger Bands</h3>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-green-600">Up: {data.bollinger.upper}</span>
              <span className="text-red-600">Low: {data.bollinger.lower}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4">Indicators Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">EMA 20: <span className="font-bold">{data.ema20}</span></div>
            <div className="bg-gray-50 p-3 rounded">EMA 50: <span className="font-bold">{data.ema50}</span></div>
            <div className="bg-gray-50 p-3 rounded">Volume: <span className="font-bold">{data.volume.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}