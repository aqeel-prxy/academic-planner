import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './grades.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function percentageToGPA(percentage) {
  if (percentage >= 90) return 4.0;
  if (percentage >= 85) return 3.9;
  if (percentage >= 80) return 3.8;
  if (percentage >= 75) return 3.7;
  if (percentage >= 70) return 3.5;
  if (percentage >= 65) return 3.0;
  if (percentage >= 60) return 2.5;
  if (percentage >= 55) return 2.0;
  if (percentage >= 50) return 1.5;
  return 0;
}

function GradesVsTarget({ grades, modules }) {
  if (!grades || grades.length === 0) {
    return (
      <div className="chart-card">
        <h3>Grades vs Target</h3>
        <p className="no-data">No grade data available. Add grades to compare with targets.</p>
      </div>
    );
  }

  // Map grades to modules and prepare data
  const moduleGradeMap = {};
  grades.forEach(grade => {
    const module = modules.find(m => m.id === grade.moduleId);
    if (module && !moduleGradeMap[module.id]) {
      moduleGradeMap[module.id] = {
        moduleCode: module.moduleCode,
        currentGrade: grade.currentGPA,
        targetGrade: percentageToGPA(module.targetGrade),
        moduleName: module.moduleName
      };
    }
  });

  const moduleData = Object.values(moduleGradeMap);

  if (moduleData.length === 0) {
    return (
      <div className="chart-card">
        <h3>Grades vs Target</h3>
        <p className="no-data">No grade data available. Add grades to compare with targets.</p>
      </div>
    );
  }

  const chartData = {
    labels: moduleData.map(m => m.moduleCode),
    datasets: [
      {
        label: 'Current Grade (GPA)',
        data: moduleData.map(m => m.currentGrade),
        backgroundColor: '#3788d8',
        borderColor: '#2e6fa8',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Target Grade (GPA)',
        data: moduleData.map(m => m.targetGrade),
        backgroundColor: '#27ae60',
        borderColor: '#1e8449',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
        cornerRadius: 4,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
          }
        }
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
      <h3>Grades vs Target</h3>
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
      <div className="comparison-details">
        <table className="grades-table">
          <thead>
            <tr>
              <th>Module Code</th>
              <th>Module Name</th>
              <th>Current Grade</th>
              <th>Target Grade</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {moduleData.map((m, idx) => {
              const diff = m.currentGrade - m.targetGrade;
              const status = diff >= 0 ? 'on-track' : 'behind';
              return (
                <tr key={idx} className={`status-${status}`}>
                  <td className="module-code">{m.moduleCode}</td>
                  <td className="module-name">{m.moduleName}</td>
                  <td className="grade-value">{m.currentGrade.toFixed(2)}</td>
                  <td className="grade-value">{m.targetGrade.toFixed(2)}</td>
                  <td className="difference">
                    <span className={diff >= 0 ? 'positive' : 'negative'}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GradesVsTarget;
