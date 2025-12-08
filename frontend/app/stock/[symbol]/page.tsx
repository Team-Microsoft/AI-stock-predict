// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import axios from '../../../utils/api';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StockDetail() {
  const { symbol } = useParams();
  const [date, setDate] = useState('');
  const [algorithm, setAlgorithm] = useState('Linear Regression');
  const [prediction, setPrediction] = useState<any>(null);
  const [forecasts, setForecasts] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const baseUrl = 'http://127.0.0.1:5000';

  useEffect(() => {
    if (symbol) {
      axios.post(`${baseUrl}/api/forecast`, { symbol })
        .then(res => setForecasts(res.data.forecasts))
        .catch(err => console.error("Forecast fetch error", err));
    }
  }, [symbol]);

  const handlePredict = async () => {
    if (!date) return alert("Please select a date");
    setLoading(true);

    try {
      const res = await axios.post(`${baseUrl}/api/predict`, {
        symbol,
        date,
        algorithm
      });
      setPrediction(res.data);
    } catch (err) {
      console.error("Prediction Error:", err);
      alert("Prediction failed. Ensure backend is running.");
    }
    setLoading(false);
  };

  const chartData = {
    labels: prediction?.history?.dates.slice(-100) || [],
    datasets: [
      {
        label: 'Historical Price',
        data: prediction?.history?.prices.slice(-100) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'MA 20',
        data: prediction?.history?.ma20?.slice(-100) || [],
        borderColor: '#FFD700',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: 'MA 50',
        data: prediction?.history?.ma50?.slice(-100) || [],
        borderColor: '#FF4500',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      }
    ]
  };

  const algoChartData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      { label: 'Linear Reg', data: prediction?.algoComparison?.linear || [], backgroundColor: 'rgba(59, 130, 246, 0.6)', borderWidth: 1 },
      { label: 'Random Forest', data: prediction?.algoComparison?.rf || [], backgroundColor: 'rgba(16, 185, 129, 0.6)', borderWidth: 1 },
      { label: 'XGBoost', data: prediction?.algoComparison?.xgboost || [], backgroundColor: 'rgba(245, 158, 11, 0.6)', borderWidth: 1 },
      { label: 'LSTM', data: prediction?.algoComparison?.lstm || [], backgroundColor: 'rgba(139, 92, 246, 0.6)', borderWidth: 1 }
    ]
  };

  const historyLen = prediction?.history?.prices?.length || 0;
  const latestMA20 = prediction?.history?.ma20 ? prediction.history.ma20[historyLen - 1] : null;
  const latestMA50 = prediction?.history?.ma50 ? prediction.history.ma50[historyLen - 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{String(symbol)} Analysis</h1>
              
              {/* UPDATED LINKS SECTION */}
              <div className="flex gap-3 mt-2 text-sm items-center">
                <a href={`/technical/${symbol}`} className="text-blue-600 hover:underline">View Technicals</a>
                <span className="text-gray-300">|</span>
                <a href={`/compare/${symbol}`} className="text-blue-600 hover:underline">Compare Algorithms</a>
                <span className="text-gray-300">|</span>
                {/* Passes symbol to portfolio page */}
                <a href={`/portfolio?symbol=${symbol}`} className="bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors font-medium">
                  + Add to Portfolio
                </a>
              </div>

            </div>
            {prediction && (
               <div className="text-right bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Current Price</p>
                  <p className="text-2xl font-bold text-gray-900">₹{prediction.currentPrice}</p>
               </div>
            )}
          </div>

          {forecasts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-xs text-gray-500 font-semibold uppercase">Next Day Forecast</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{forecasts.nextDay}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold uppercase">30-Day Outlook</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{forecasts.day30}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold uppercase">60-Day Outlook</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{forecasts.day60}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold uppercase">90-Day Outlook</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{forecasts.day90}</p>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-500 animate-pulse">
              Loading Multi-Horizon Forecasts...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Date</label>
                  <input type="date" className="mt-1 block w-full rounded-md border p-2" onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Algorithm</label>
                  <select className="mt-1 block w-full rounded-md border p-2" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                    <option>Linear Regression</option>
                    <option>Random Forest</option>
                    <option>XGBoost</option>
                    <option>LSTM</option>
                  </select>
                </div>
                <button onClick={handlePredict} disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Analyzing...' : 'RUN PREDICTION'}
                </button>
              </div>
            </div>

            {prediction && (
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Results</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span>Prediction</span><span className="font-bold text-blue-600">₹{prediction.predictedPrice}</span></div>
                        <div className="flex justify-between"><span>RMSE</span><span className="font-bold">{prediction.rmse}</span></div>
                        <div className="flex justify-between"><span>52W High</span><span className="text-green-600">₹{prediction.week52High}</span></div>
                        <div className="flex justify-between"><span>52W Low</span><span className="text-red-600">₹{prediction.week52Low}</span></div>
                        <div className="border-t pt-2 mt-2"></div>
                        <div className="flex justify-between text-sm"><span>MA 20</span><span className="font-medium text-yellow-600">₹{latestMA20 ? latestMA20.toFixed(2) : '-'}</span></div>
                        <div className="flex justify-between text-sm"><span>MA 50</span><span className="font-medium text-orange-600">₹{latestMA50 ? latestMA50.toFixed(2) : '-'}</span></div>
                    </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Price History & Moving Averages</h3>
                <div className="h-80 w-full relative">
                    {prediction ? (
                        <Line data={chartData} options={{ maintainAspectRatio: false, responsive: true, animation: false }} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded">
                            Select date to view chart
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Algorithm Comparison (7-Day Forecast)</h3>
                <div className="h-64 w-full relative">
                    {prediction ? (
                        <Bar data={algoChartData} options={{ maintainAspectRatio: false, responsive: true, scales: { y: { beginAtZero: false } } }} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded">
                            Run prediction to compare algorithms
                        </div>
                    )}
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}