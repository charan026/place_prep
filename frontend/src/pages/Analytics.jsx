import { useState, useEffect } from 'react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProgressChart from '../components/charts/ProgressChart';
import TopicChart from '../components/charts/TopicChart';
import ActivityHeatmap from '../components/charts/ActivityHeatmap';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  BarChart3, TrendingUp, Target, Flame, Code2, Award
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 !rounded-lg text-sm">
        <p className="text-surface-400 text-xs">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [dsaProgress, setDSAProgress] = useState([]);
  const [activity, setActivity] = useState([]);
  const [interviewData, setInterviewData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [overviewRes, dsaRes, activityRes, interviewRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/dsa-progress'),
        api.get('/analytics/activity'),
        api.get('/analytics/interviews'),
      ]);

      setOverview(overviewRes.data);
      setDSAProgress(dsaRes.data);
      setActivity(activityRes.data);
      setInterviewData(interviewRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  }

  // Aggregate DSA data by topic for bar chart
  const topicData = Object.values(
    dsaProgress.reduce((acc, row) => {
      if (!acc[row.topic]) {
        acc[row.topic] = { topic: row.topic, solved: 0, total: 0 };
      }
      acc[row.topic].solved += parseInt(row.solved) || 0;
      acc[row.topic].total += parseInt(row.total) || 0;
      return acc;
    }, {})
  );

  // Aggregate DSA data by difficulty for pie chart
  const difficultyData = Object.values(
    dsaProgress.reduce((acc, row) => {
      if (!acc[row.difficulty]) {
        acc[row.difficulty] = { difficulty: row.difficulty, solved: 0, total: 0 };
      }
      acc[row.difficulty].solved += parseInt(row.solved) || 0;
      acc[row.difficulty].total += parseInt(row.total) || 0;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Analytics</h1>
        <p className="text-surface-400 text-sm mt-1">Track your preparation progress</p>
      </div>

      {/* Stats summary */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Code2, label: 'Solved', value: overview.questions_solved, color: 'from-primary-500 to-primary-600' },
            { icon: Target, label: 'Attempted', value: overview.questions_attempted, color: 'from-amber-500 to-orange-500' },
            { icon: Flame, label: 'Streak', value: `${overview.current_streak}d`, color: 'from-rose-500 to-pink-500' },
            { icon: Award, label: 'Resume', value: overview.best_resume_score || '—', color: 'from-emerald-500 to-teal-500' },
            { icon: TrendingUp, label: 'Interviews', value: overview.completed_interviews, color: 'from-accent-violet to-purple-600' },
            { icon: BarChart3, label: 'Avg Score', value: overview.avg_interview_score || '—', color: 'from-cyan-500 to-blue-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-4 text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color}`} />
              <div className={`w-9 h-9 mx-auto rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2 opacity-80`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-surface-100">{value}</p>
              <p className="text-xs text-surface-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-surface-300 mb-4">Topic-wise Progress</h3>
          <ProgressChart data={topicData} />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-surface-300 mb-4">Difficulty Breakdown</h3>
          <TopicChart data={difficultyData} />
        </Card>
      </div>

      {/* Activity heatmap */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-4">Solving Activity</h3>
        <ActivityHeatmap data={activity} />
      </Card>

      {/* Interview performance chart */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-4">Interview Performance Trend</h3>
        {interviewData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={interviewData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="overall_score"
                name="Score"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={{ r: 4, fill: '#6366f1', stroke: '#020617', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#020617', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-surface-500">
            Complete mock interviews to see your trend
          </div>
        )}
      </Card>

      {/* Topic progress bars */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-4">Detailed Topic Progress</h3>
        <div className="space-y-4">
          {topicData.map((topic) => (
            <div key={topic.topic}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-300">{topic.topic}</span>
                <span className="text-xs text-surface-500 font-mono">{topic.solved}/{topic.total}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${topic.total > 0 ? (topic.solved / topic.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
