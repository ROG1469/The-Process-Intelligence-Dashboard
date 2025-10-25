import { ProcessStep } from './data/processData';

export interface RiskAnalysis {
  processName: string;
  processId: string;
  delayPercentage: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number;
  isPotentialBottleneck: boolean;
  averageDuration: number;
  actualDuration: number;
  delayTime: number;
  aiMessage?: string | null; // AI-generated insight message from backend
}

/**
 * Calculates a risk score (0-100) based on the comparison between
 * actual duration and average duration.
 * 
 * Risk Score Calculation:
 * - Base risk: (actualDuration / averageDuration - 1) * 100
 * - Weighted by absolute delay time
 * - Normalized to 0-100 range
 * 
 * @param actualDuration - The actual time taken for the process
 * @param averageDuration - The expected/average time for the process
 * @returns Risk score between 0 and 100
 */
export function calculateRiskScore(actualDuration: number, averageDuration: number): number {
  if (averageDuration === 0) return 0;
  
  // Calculate percentage over average
  const performanceRatio = actualDuration / averageDuration;
  
  // Base risk calculation
  let riskScore = 0;
  
  if (performanceRatio <= 1.0) {
    // On track or better - low risk
    riskScore = Math.max(0, 20 - ((1.0 - performanceRatio) * 50));
  } else {
    // Behind schedule - calculate risk
    const delayFactor = performanceRatio - 1.0;
    
    // Exponential risk increase for larger delays
    if (delayFactor <= 0.2) {
      // 0-20% delay: 20-50 risk
      riskScore = 20 + (delayFactor * 150);
    } else if (delayFactor <= 0.5) {
      // 20-50% delay: 50-80 risk
      riskScore = 50 + ((delayFactor - 0.2) * 100);
    } else {
      // >50% delay: 80-100 risk
      riskScore = 80 + Math.min(20, (delayFactor - 0.5) * 40);
    }
  }
  
  // Ensure score is within 0-100 range
  return Math.min(100, Math.max(0, Math.round(riskScore)));
}

/**
 * Determines the risk level category based on risk score
 * 
 * @param riskScore - Risk score (0-100)
 * @returns Risk level category
 */
export function getRiskLevel(riskScore: number): RiskAnalysis['riskLevel'] {
  if (riskScore >= 80) return 'Critical';
  if (riskScore >= 60) return 'High';
  if (riskScore >= 30) return 'Medium';
  return 'Low';
}

/**
 * Analyzes a single process step and returns risk analysis
 * 
 * @param process - Process step to analyze
 * @returns Risk analysis for the process
 */
export function analyzeProcess(process: ProcessStep): RiskAnalysis {
  const riskScore = calculateRiskScore(process.actualDuration, process.averageDuration);
  const delayPercentage = ((process.actualDuration / process.averageDuration) - 1) * 100;
  const delayTime = process.actualDuration - process.averageDuration;
  const isPotentialBottleneck = riskScore > 70;
  
  return {
    processName: process.name,
    processId: process.id,
    delayPercentage: Math.round(delayPercentage * 10) / 10, // Round to 1 decimal
    riskLevel: getRiskLevel(riskScore),
    riskScore,
    isPotentialBottleneck,
    averageDuration: process.averageDuration,
    actualDuration: process.actualDuration,
    delayTime
  };
}

/**
 * Analyzes multiple processes and returns a summary array
 * with risk analysis for each process
 * 
 * @param processes - Array of process steps to analyze
 * @returns Array of risk analyses sorted by risk score (highest first)
 */
export function analyzeProcesses(processes: ProcessStep[]): RiskAnalysis[] {
  return processes
    .map(process => analyzeProcess(process))
    .sort((a, b) => b.riskScore - a.riskScore); // Sort by risk score descending
}

/**
 * Gets summary statistics for the analyzed processes
 * 
 * @param analyses - Array of risk analyses
 * @returns Summary statistics
 */
export function getRiskSummary(analyses: RiskAnalysis[]) {
  const totalProcesses = analyses.length;
  const bottlenecks = analyses.filter(a => a.isPotentialBottleneck);
  const criticalCount = analyses.filter(a => a.riskLevel === 'Critical').length;
  const highCount = analyses.filter(a => a.riskLevel === 'High').length;
  const mediumCount = analyses.filter(a => a.riskLevel === 'Medium').length;
  const lowCount = analyses.filter(a => a.riskLevel === 'Low').length;
  
  const averageRiskScore = Math.round(
    analyses.reduce((sum, a) => sum + a.riskScore, 0) / totalProcesses
  );
  
  const totalDelay = analyses.reduce((sum, a) => sum + Math.max(0, a.delayTime), 0);
  
  return {
    totalProcesses,
    bottleneckCount: bottlenecks.length,
    bottlenecks: bottlenecks.map(b => b.processName),
    riskDistribution: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount
    },
    averageRiskScore,
    totalDelay,
    mostProblematic: analyses[0]?.processName || 'None'
  };
}

/**
 * Formats risk analysis for console logging
 * 
 * @param analyses - Array of risk analyses
 * @returns Formatted string for logging
 */
export function formatRiskReport(analyses: RiskAnalysis[]): string {
  const summary = getRiskSummary(analyses);
  
  let report = '\n=== AI Bottleneck Risk Analysis ===\n\n';
  report += `Total Processes: ${summary.totalProcesses}\n`;
  report += `Average Risk Score: ${summary.averageRiskScore}/100\n`;
  report += `Potential Bottlenecks: ${summary.bottleneckCount}\n`;
  report += `Most Problematic: ${summary.mostProblematic}\n\n`;
  
  report += '=== Risk Distribution ===\n';
  report += `🔴 Critical: ${summary.riskDistribution.critical}\n`;
  report += `🟠 High: ${summary.riskDistribution.high}\n`;
  report += `🟡 Medium: ${summary.riskDistribution.medium}\n`;
  report += `🟢 Low: ${summary.riskDistribution.low}\n\n`;
  
  if (summary.bottlenecks.length > 0) {
    report += '=== Identified Bottlenecks ===\n';
    summary.bottlenecks.forEach((name, index) => {
      report += `${index + 1}. ${name}\n`;
    });
    report += '\n';
  }
  
  report += '=== Detailed Analysis ===\n';
  analyses.forEach((analysis, index) => {
    const icon = analysis.isPotentialBottleneck ? '⚠️ ' : '  ';
    report += `${icon}${index + 1}. ${analysis.processName}\n`;
    report += `   Risk Score: ${analysis.riskScore}/100 (${analysis.riskLevel})\n`;
    report += `   Delay: ${analysis.delayPercentage.toFixed(1)}%\n`;
    report += `   Actual: ${(analysis.actualDuration / 1000).toFixed(1)}s vs `;
    report += `Average: ${(analysis.averageDuration / 1000).toFixed(1)}s\n`;
    if (analysis.isPotentialBottleneck) {
      report += `   ⚠️  POTENTIAL BOTTLENECK DETECTED\n`;
    }
    report += '\n';
  });
  
  return report;
}