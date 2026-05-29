import React, { useState, useMemo } from "react";

const formatPrice = (price) => {
  if (!price) return "0";
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const AnalyticsChart = ({ orders = [], type = "store" }) => {
  const [timeRange, setTimeRange] = useState("7_days"); // "7_days" or "6_months"
  const [activeMetric, setActiveMetric] = useState("revenue"); // "sales", "commission", "revenue"
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // 1. Filter completed orders for statistical accuracy
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.orderStatus === "completed");
  }, [orders]);

  // 2. Prepare aggregated data
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    if (timeRange === "7_days") {
      // Last 7 days including today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        let sales = 0;
        let commission = 0;
        let revenue = 0;

        completedOrders.forEach((o) => {
          const orderDate = new Date(o.createdAt);
          if (orderDate >= startOfDay && orderDate <= endOfDay) {
            sales += o.totalPrice || 0;
            commission += o.commissionAmount || 0;
            revenue += o.storeRevenue || 0;
          }
        });

        data.push({ label, sales, commission, revenue });
      }
    } else {
      // Last 6 months including today's month
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const label = `Tháng ${d.getMonth() + 1}`;
        let sales = 0;
        let commission = 0;
        let revenue = 0;

        completedOrders.forEach((o) => {
          const orderDate = new Date(o.createdAt);
          if (orderDate >= startOfMonth && orderDate <= endOfMonth) {
            sales += o.totalPrice || 0;
            commission += o.commissionAmount || 0;
            revenue += o.storeRevenue || 0;
          }
        });

        data.push({ label, sales, commission, revenue });
      }
    }

    return data;
  }, [completedOrders, timeRange]);

  // 3. Find max value to scale chart appropriately
  const maxValue = useMemo(() => {
    const vals = chartData.map((d) => d[activeMetric]);
    const max = Math.max(...vals, 100000); // minimum scale limit
    return Math.ceil(max * 1.15); // Add 15% padding at top
  }, [chartData, activeMetric]);

  // 4. SVG Layout Configurations
  const width = 800;
  const height = 300;
  const padding = { left: 80, right: 30, top: 30, bottom: 40 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculate points coordinates
  const points = useMemo(() => {
    return chartData.map((d, index) => {
      const x = padding.left + (index * graphWidth) / (chartData.length - 1);
      const val = d[activeMetric];
      const y = padding.top + graphHeight - (val / maxValue) * graphHeight;
      return { x, y, data: d };
    });
  }, [chartData, maxValue, graphWidth, graphHeight, activeMetric, padding]);

  // Generate SVG Path
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // Smooth curve command using Bezier control points
      const prev = points[i - 1];
      const cpX1 = prev.x + graphWidth / (chartData.length - 1) / 3;
      const cpY1 = prev.y;
      const cpX2 = p.x - graphWidth / (chartData.length - 1) / 3;
      const cpY2 = p.y;
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }, "");
  }, [points, graphWidth, chartData.length]);

  // Generate closed area path for gradient filling
  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const baseLineY = padding.top + graphHeight;
    return `${pathD} L ${points[points.length - 1].x} ${baseLineY} L ${points[0].x} ${baseLineY} Z`;
  }, [points, pathD, padding, graphHeight]);

  // Set colors based on selected metric
  const metricColors = useMemo(() => {
    switch (activeMetric) {
      case "sales":
        return {
          stroke: "#2563eb",
          fill: "url(#gradient-sales)",
          dot: "#1d4ed8",
          bg: "#eff6ff",
          text: "Tổng doanh số gộp",
        };
      case "commission":
        return {
          stroke: "#ea580c",
          fill: "url(#gradient-commission)",
          dot: "#c2410c",
          bg: "#fff7ed",
          text: type === "admin" ? "Hoa hồng Admin" : "Chiết khấu sàn",
        };
      case "revenue":
      default:
        return {
          stroke: "#16a34a",
          fill: "url(#gradient-revenue)",
          dot: "#15803d",
          bg: "#f0fdf4",
          text: type === "admin" ? "Shop thực nhận" : "Doanh thu thực nhận",
        };
    }
  }, [activeMetric, type]);

  // Horizontal grid lines values
  const gridLines = useMemo(() => {
    const lines = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      const val = (maxValue * i) / count;
      const y = padding.top + graphHeight - (val / maxValue) * graphHeight;
      lines.push({ value: val, y });
    }
    return lines;
  }, [maxValue, graphHeight, padding]);

  return (
    <div
      className="analytics-chart-container glass"
      style={{
        padding: "24px",
        borderRadius: "12px",
        background: "var(--glass-bg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        position: "relative",
        overflow: "visible",
        marginBottom: "24px",
      }}
    >
      {/* Header controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveMetric("sales")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              background: activeMetric === "sales" ? "#2563eb" : "#f1f5f9",
              color: activeMetric === "sales" ? "white" : "#475569",
              transition: "all 0.2s ease",
            }}
          >
            {type === "admin" ? "🛍️ Tổng doanh số toàn sàn" : "🛍️ Doanh số gộp"}
          </button>
          <button
            onClick={() => setActiveMetric("commission")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              background: activeMetric === "commission" ? "#ea580c" : "#f1f5f9",
              color: activeMetric === "commission" ? "white" : "#475569",
              transition: "all 0.2s ease",
            }}
          >
            {type === "admin" ? "💎 Thu nhập hoa hồng (5%)" : "🛡️ Phí sàn (5%)"}
          </button>
          <button
            onClick={() => setActiveMetric("revenue")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              background: activeMetric === "revenue" ? "#16a34a" : "#f1f5f9",
              color: activeMetric === "revenue" ? "white" : "#475569",
              transition: "all 0.2s ease",
            }}
          >
            {type === "admin" ? "🏬 Các Shop nhận (95%)" : "💸 Thực nhận (95%)"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            onClick={() => setTimeRange("7_days")}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              background: timeRange === "7_days" ? "white" : "transparent",
              color: timeRange === "7_days" ? "var(--text-main)" : "#64748b",
              boxShadow: timeRange === "7_days" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setTimeRange("6_months")}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              background: timeRange === "6_months" ? "white" : "transparent",
              color: timeRange === "6_months" ? "var(--text-main)" : "#64748b",
              boxShadow: timeRange === "6_months" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            6 tháng qua
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="gradient-sales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-commission" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={width - padding.right}
                y2={line.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={line.y + 4}
                textAnchor="end"
                style={{ fontSize: "11px", fill: "#64748b", fontWeight: "500" }}
              >
                {formatPrice(Math.round(line.value))}đ
              </text>
            </g>
          ))}

          {/* Area under the line */}
          <path d={areaD} fill={metricColors.fill} />

          {/* Core trend line */}
          <path
            d={pathD}
            fill="none"
            stroke={metricColors.stroke}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical guideline on hover */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <line
              x1={points[hoveredIdx].x}
              y1={padding.top}
              x2={points[hoveredIdx].x}
              y2={padding.top + graphHeight}
              stroke={metricColors.stroke}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Dots on points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? "6.5" : "4.5"}
              fill="white"
              stroke={hoveredIdx === idx ? metricColors.dot : metricColors.stroke}
              strokeWidth={hoveredIdx === idx ? "3" : "2"}
              style={{ transition: "all 0.1s ease", cursor: "pointer" }}
            />
          ))}

          {/* Labels for X-axis */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              style={{
                fontSize: "11px",
                fill: hoveredIdx === idx ? "var(--text-main)" : "#64748b",
                fontWeight: hoveredIdx === idx ? "700" : "500",
                transition: "all 0.15s ease",
              }}
            >
              {p.data.label}
            </text>
          ))}

          {/* Invisible interactive zones for hovering */}
          {points.map((p, idx) => {
            const hitWidth = graphWidth / (points.length - 1 || 1);
            const startX = p.x - hitWidth / 2;
            return (
              <rect
                key={idx}
                x={idx === 0 ? padding.left : startX}
                y={padding.top}
                width={idx === 0 || idx === points.length - 1 ? hitWidth / 2 : hitWidth}
                height={graphHeight}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* HTML Tooltip inside absolute container */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="glass"
            style={{
              position: "absolute",
              left: `${points[hoveredIdx].x}px`,
              top: `${points[hoveredIdx].y - 85}px`,
              transform: "translateX(-50%)",
              padding: "10px 14px",
              borderRadius: "8px",
              pointerEvents: "none",
              zIndex: 10,
              fontSize: "12px",
              whiteSpace: "nowrap",
              boxShadow: "var(--shadow-md)",
              border: `1px solid ${metricColors.stroke}`,
              background: "white",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              transition: "left 0.1s ease, top 0.1s ease",
            }}
          >
            <div style={{ fontWeight: "600", color: "#64748b" }}>
              {points[hoveredIdx].data.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: metricColors.stroke,
                }}
              />
              <span style={{ fontWeight: "bold", color: "#1e293b" }}>
                {metricColors.text}:
              </span>
              <span
                style={{
                  fontWeight: "800",
                  color: metricColors.dot,
                  fontSize: "13px",
                }}
              >
                {formatPrice(points[hoveredIdx].data[activeMetric])}đ
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsChart;
