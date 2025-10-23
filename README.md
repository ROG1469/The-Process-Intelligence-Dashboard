# 🚀 AI-Powered Warehouse Bottleneck Detector

An intelligent dashboard that helps operations managers identify, analyze, and resolve warehouse process bottlenecks in real-time.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss)

## 🎯 Problem Statement

Warehouse operations face daily challenges with process bottlenecks that cost thousands of dollars per hour in lost productivity. Traditional monitoring tools show data but don't provide actionable insights or financial impact analysis.

## ✨ Solution

This AI-powered dashboard transforms raw process data into actionable intelligence by:

- **🔍 Real-time Bottleneck Detection** - Automatically identifies critical delays across 6 warehouse processes
- **💰 Financial Impact Analysis** - Calculates cost per hour for each bottleneck
- **🎯 AI Recommendations** - Generates specific, actionable fixes with ROI projections
- **📊 Scenario Planning** - Test "what-if" scenarios before implementation
- **📈 Period Comparison** - Track trends and improvements over time

## 🏭 Warehouse Processes Monitored

1. **Receiving** - Unloading and initial intake
2. **Quality Check** - Inspection and verification
3. **Storing** - Putaway and inventory placement
4. **Material Picking** - Order fulfillment picking
5. **Packaging** - Order preparation
6. **Dispatch** - Final shipping

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Architecture:** React Server Components + Client Components

## 📊 Key Features

### Active Bottlenecks Panel
- Unified view of all process issues
- Risk scoring and severity classification
- Inline cost impact display ($/hour)
- Expandable AI recommendations with savings projections

### Interactive Visualization
- Minute-by-minute performance chart
- Process-specific filtering
- Time range selection (Last Hour, 4 Hours, 8 Hours, 24 Hours)
- Severity threshold adjustment
- Resizable panels for custom layouts

### Scenario Planner
- Test process improvements before implementation
- Adjust improvement percentages per process
- Real-time impact calculations
- Cost savings projections

### Period Comparison
- Compare current performance vs. previous period
- Trend analysis with visual indicators
- Improvement tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-warehouse-bottleneck-detector.git

# Navigate to project directory
cd ai-warehouse-bottleneck-detector

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard page
│   └── layout.tsx            # Root layout
├── components/
│   ├── DashboardLayout.tsx   # Main layout with resizable panels
│   ├── ProcessTimelineChart.tsx # Recharts visualization
│   ├── InsightPanel.tsx      # AI insights container
│   ├── ScenarioPlanner.tsx   # What-if analysis tool
│   └── PeriodComparison.tsx  # Trend comparison
├── data/
│   └── processData.ts        # Simulated warehouse data
└── aiLogic.ts                # Bottleneck detection algorithms
```

## 🧠 AI Logic

The system analyzes process performance using:

1. **Statistical Analysis** - Compares actual vs. expected performance
2. **Risk Scoring** - Weighted algorithm based on delay percentage and variance
3. **Bottleneck Detection** - Identifies constraint points using Theory of Constraints
4. **Recommendation Engine** - Pattern matching for common warehouse scenarios
5. **Financial Modeling** - Calculates operational cost impact

## 💡 Use Cases

- **Operations Managers** - Daily monitoring and quick decision-making
- **Process Engineers** - Root cause analysis and continuous improvement
- **Warehouse Supervisors** - Shift performance tracking
- **Executive Teams** - High-level metrics and cost analysis

## 🔮 Future Enhancements

- [ ] Real-time data integration (currently simulated)
- [ ] Machine learning for predictive bottlenecks
- [ ] Mobile-responsive design
- [ ] Export reports (PDF/Excel)
- [ ] User authentication and multi-warehouse support
- [ ] Alert notifications system
- [ ] Shift performance comparison

## 📝 License

MIT License - feel free to use this project for learning or portfolio purposes.

---

⭐ If you find this project useful, please consider giving it a star!
