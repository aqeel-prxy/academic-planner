import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './grades.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function GPATrendChart({ trendData }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="chart-card">
        <h3>GPA Trend (Semester/Weekly)</h3>
        <p className="no-data">No GPA trend data available yet. Add grades to see trends.</p>
      </div>
    );
  }

  const chartData = {
    labels: trendData.map(item => item.period),
    datasets: [
      {
        label: 'GPA Trend',
        data: trendData.map(item => item.gpa),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        cornerRadius: 4
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 4.0,
        ticks: {
          stepSize: 0.5
        },
        grid: {
          drawBorder: false,
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          drawBorder: false,
          display: false
        }
      }
    }
  };

  return (
    <div className="chart-card">
      <h3>GPA Trend (Semester/Weekly)</h3>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
      <div className="trend-summary">
        <p>Tracking your GPA progression over semesters and weeks to identify improvement patterns.</p>
      </div>
    </div>
  );
}

export default GPATrendChart;
