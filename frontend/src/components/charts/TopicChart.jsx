import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#f43f5e',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 !rounded-lg text-sm">
        <p className="font-semibold text-surface-200">{payload[0].name}</p>
        <p className="text-xs mt-1" style={{ color: payload[0].payload.fill }}>
          Solved: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const TopicChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-500">
        No data available yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.difficulty?.charAt(0).toUpperCase() + d.difficulty?.slice(1),
    value: parseInt(d.solved) || 0,
    fill: COLORS[d.difficulty] || '#6366f1',
  })).filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-500">
        Solve some questions to see the breakdown
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          label={renderCustomLabel}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TopicChart;
