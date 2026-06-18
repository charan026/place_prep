import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Code2, FileText, MessageSquare, TrendingUp,
  Flame, Target, Award, ArrowRight, Zap, Settings2
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subtitle, gradient, delay }) => (
  <div className="glass-card p-6 relative overflow-hidden animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-surface-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-surface-100">{value}</p>
        {subtitle && <p className="text-xs text-surface-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center opacity-80`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const QuickAction = ({ to, icon: Icon, label, description, gradient }) => (
  <Link to={to} className="glass-card-hover p-5 flex items-center gap-4 group">
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-surface-200">{label}</p>
      <p className="text-xs text-surface-500">{description}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-primary-400 transition-colors" />
  </Link>
);

const DailyGoalRing = ({ solved, goal, onChangeGoal }) => {
  const progress = Math.min(solved / goal, 1);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);
  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(goal);

  const handleSave = () => {
    if (newGoal >= 1 && newGoal <= 50) {
      onChangeGoal(newGoal);
      setEditing(false);
    }
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" className="transform -rotate-90">
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="none"
              className="text-surface-800" />
            <circle cx="60" cy="60" r="54" strokeWidth="8" fill="none"
              stroke="url(#goalGradient)"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-surface-100">{solved}</span>
            <span className="text-[10px] text-surface-500">of {goal}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-surface-300 mb-1">Daily Goal</h3>
          {solved >= goal ? (
            <p className="text-emerald-400 font-medium text-sm">🎉 Goal completed! Amazing work!</p>
          ) : (
            <p className="text-surface-400 text-sm">
              {goal - solved} more {goal - solved === 1 ? 'question' : 'questions'} to hit your daily goal
            </p>
          )}
          <div className="mt-3">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1" max="50"
                  value={newGoal}
                  onChange={(e) => setNewGoal(parseInt(e.target.value) || 1)}
                  className="input-field !py-1.5 !px-3 w-20 text-sm"
                />
                <button onClick={handleSave} className="btn-primary text-xs !px-3 !py-1.5">Save</button>
                <button onClick={() => setEditing(false)} className="text-xs text-surface-500 hover:text-surface-300">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => { setNewGoal(goal); setEditing(true); }}
                className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-400 transition-colors"
              >
                <Settings2 size={12} />
                Change goal ({goal}/day)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/overview');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats:', err);
        setStats({
          questions_solved: 0, total_questions: 0, questions_attempted: 0,
          total_resumes: 0, best_resume_score: 0,
          total_interviews: 0, completed_interviews: 0, avg_interview_score: 0,
          current_streak: 0, today_solved: 0, daily_goal: 3,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleChangeGoal = async (newGoal) => {
    try {
      await api.put('/users/daily-goal', { daily_goal: newGoal });
      setStats(prev => ({ ...prev, daily_goal: newGoal }));
    } catch (err) {
      console.error('Failed to update daily goal:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-transparent to-accent-cyan/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">
              {stats.current_streak > 0 ? `${stats.current_streak} day streak! Keep going!` : 'Start your streak today!'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-surface-100">
            {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-surface-400 mt-2 max-w-lg">
            {stats.questions_solved > 0
              ? `You've solved ${stats.questions_solved} questions so far. Keep up the great work!`
              : 'Ready to start your placement preparation? Pick a topic and begin solving!'}
          </p>
        </div>
      </div>

      {/* Stats grid + Daily Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <StatCard
            icon={Code2} label="Questions Solved" value={stats.questions_solved}
            subtitle={`out of ${stats.total_questions}`}
            gradient="from-primary-500 to-primary-600" delay={0}
          />
          <StatCard
            icon={Flame} label="Current Streak" value={`${stats.current_streak}d`}
            subtitle="consecutive days"
            gradient="from-amber-500 to-orange-500" delay={100}
          />
          <StatCard
            icon={Award} label="Resume Score" value={stats.best_resume_score || '—'}
            subtitle={stats.total_resumes > 0 ? 'best score' : 'upload to analyze'}
            gradient="from-emerald-500 to-teal-500" delay={200}
          />
          <StatCard
            icon={Target} label="Interviews Done" value={stats.completed_interviews}
            subtitle={stats.avg_interview_score ? `avg score: ${stats.avg_interview_score}` : 'start a mock interview'}
            gradient="from-accent-violet to-purple-600" delay={300}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <DailyGoalRing
            solved={stats.today_solved || 0}
            goal={stats.daily_goal || 3}
            onChangeGoal={handleChangeGoal}
          />
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-surface-300">Overall DSA Progress</h3>
          <span className="text-sm text-primary-400 font-mono">
            {stats.questions_solved}/{stats.total_questions}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${stats.total_questions > 0 ? (stats.questions_solved / stats.total_questions) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-surface-500 mt-2">
          {stats.total_questions > 0
            ? `${Math.round((stats.questions_solved / stats.total_questions) * 100)}% complete`
            : 'No questions available'}
        </p>
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-surface-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction to="/dsa-tracker" icon={Code2} label="Solve Problems"
            description="Track your DSA progress" gradient="from-primary-500 to-primary-600" />
          <QuickAction to="/resume" icon={FileText} label="Analyze Resume"
            description="Get AI-powered feedback" gradient="from-emerald-500 to-teal-500" />
          <QuickAction to="/interview" icon={MessageSquare} label="Mock Interview"
            description="Practice with AI interviewer" gradient="from-accent-violet to-purple-600" />
          <QuickAction to="/experiences" icon={TrendingUp} label="Company Insights"
            description="Learn from experiences" gradient="from-amber-500 to-orange-500" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
