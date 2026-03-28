import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiTrendingDown } from 'react-icons/fi';
import './grades.css';

function RiskHeatmap({ riskAnalysis, modules }) {
  if (!riskAnalysis || !riskAnalysis.details || riskAnalysis.details.length === 0) {
    return (
      <div className="heatmap-card">
        <h3>Risk Heatmap - Module Performance Status</h3>
        <p className="no-data">No risk data available. Add grades to see performance status.</p>
      </div>
    );
  }

  const getRiskIcon = (riskLevel) => {
    switch(riskLevel) {
      case 'low':
        return <FiCheckCircle className="risk-icon low" />;
      case 'medium':
        return <FiAlertTriangle className="risk-icon medium" />;
      case 'high':
        return <FiTrendingDown className="risk-icon high" />;
      default:
        return null;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'low':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      case 'high':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch(riskLevel) {
      case 'low':
        return 'On Track';
      case 'medium':
        return 'At Risk';
      case 'high':
        return 'Critical';
      default:
        return '-';
    }
  };

  return (
    <div className="heatmap-card">
      <h3>Risk Heatmap - Module Performance Status</h3>
      
      {/* Risk Summary */}
      <div className="risk-summary">
        <div className="risk-count low">
          <span className="count">{riskAnalysis.riskSummary?.low || 0}</span>
          <span className="label">On Track</span>
        </div>
        <div className="risk-count medium">
          <span className="count">{riskAnalysis.riskSummary?.medium || 0}</span>
          <span className="label">At Risk</span>
        </div>
        <div className="risk-count high">
          <span className="count">{riskAnalysis.riskSummary?.high || 0}</span>
          <span className="label">Critical</span>
        </div>
      </div>

      {/* Risk Grid */}
      <div className="risk-grid">
        {riskAnalysis.details.map((item, idx) => (
          <div key={idx} className={`risk-cell risk-${item.riskLevel}`}>
            <div className="risk-header">
              {getRiskIcon(item.riskLevel)}
              <span className="risk-label">{getRiskLabel(item.riskLevel)}</span>
            </div>
            <div className="module-info">
              <div className="module-code">{item.moduleCode}</div>
              <div className="module-name">{item.moduleName}</div>
            </div>
            <div className="grade-info">
              <div className="grade-row">
                <span className="label">Current:</span>
                <span className="value">{(item.currentPercent ?? 0).toFixed(1)}%</span>
              </div>
              <div className="grade-row">
                <span className="label">Target:</span>
                <span className="value">{(item.targetPercent ?? 0).toFixed(1)}%</span>
              </div>
              <div className="grade-row">
                <span className="label">Letter:</span>
                <span className={`letter-grade grade-${item.letterGrade}`}>{item.letterGrade}</span>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.min(((item.currentPercent ?? 0) / Math.max(item.targetPercent ?? 0, 1)) * 100, 100)}%`,
                backgroundColor: getRiskColor(item.riskLevel)
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <h4>Risk Level Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#27ae60'}}></div>
            <span>Low Risk - Grade ≥ Target</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#f39c12'}}></div>
            <span>Medium Risk - Grade 10% below target</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#e74c3c'}}></div>
            <span>High Risk - Grade &gt;10% below target</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="risk-recommendations">
        <h4>Recommendations</h4>
        {riskAnalysis.riskSummary?.high > 0 && (
          <div className="recommendation high-risk">
            <FiTrendingDown className="icon" />
            <span>You have {riskAnalysis.riskSummary.high} module(s) at critical risk. Focus on these modules urgently.</span>
          </div>
        )}
        {riskAnalysis.riskSummary?.medium > 0 && (
          <div className="recommendation medium-risk">
            <FiAlertTriangle className="icon" />
            <span>You have {riskAnalysis.riskSummary.medium} module(s) at medium risk. Increase study efforts.</span>
          </div>
        )}
        {riskAnalysis.riskSummary?.low > 0 && (
          <div className="recommendation low-risk">
            <FiCheckCircle className="icon" />
            <span>Good! You have {riskAnalysis.riskSummary.low} module(s) on track. Keep up the effort.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskHeatmap;
