// @ts-nocheck
"use client";
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function CompareAlgo() {
  const { symbol } = useParams();

  const data = {
    labels: ['RMSE', 'MAE', 'R2 Score', 'Training Speed', 'Accuracy'],
    datasets: [
      {
        label: 'Linear Regression',
        data: [85, 90, 88, 95, 82],
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Random Forest',
        data: [92, 85, 90, 80, 88],
        backgroundColor: 'rgba(16, 185, 129, 0.2)', // Green
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
      {
        label: 'XGBoost',
        data: [94, 88, 93, 85, 91], // High accuracy, decent speed
        backgroundColor: 'rgba(245, 158, 11, 0.2)', // Orange
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
      },
      {
        label: 'LSTM',
        data: [78, 80, 95, 60, 92],
        backgroundColor: 'rgba(139, 92, 246, 0.2)', // Purple
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Algorithm Comparison: {String(symbol)}</h1>
        <div className="bg-white p-8 rounded-xl shadow-sm flex justify-center">
          <div className="w-full max-w-2xl h-96">
            <Radar data={data} options={{ scales: { r: { min: 0, max: 100 } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}