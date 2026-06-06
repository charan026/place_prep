import { useState, useEffect } from 'react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Search, Filter, ExternalLink, CheckCircle2,
  Circle, Clock, StickyNote, ChevronDown
} from 'lucide-react';

const TOPICS = ['All', 'Arrays', 'Strings', 'Linked List', 'Trees', 'Dynamic Programming', 'Graphs', 'Stacks & Queues'];

const DSATracker = () => {
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [notesModal, setNotesModal] = useState({ open: false, questionId: null, notes: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questionsRes, progressRes, statsRes] = await Promise.all([
        api.get('/dsa/questions'),
        api.get('/dsa/progress'),
        api.get('/dsa/progress/stats'),
      ]);

      setQuestions(questionsRes.data);

      // Build progress map: question_id -> progress data
      const progressMap = {};
      progressRes.data.forEach((p) => { progressMap[p.question_id] = p; });
      setProgress(progressMap);

      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (questionId, status) => {
    try {
      const res = await api.post('/dsa/progress', { question_id: questionId, status });
      setProgress((prev) => ({ ...prev, [questionId]: res.data }));

      // Refresh stats
      const statsRes = await api.get('/dsa/progress/stats');
      setStats(statsRes.data);

      toast.success(status === 'solved' ? '🎉 Marked as solved!' : `Status: ${status}`);
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  const saveNotes = async () => {
    try {
      await api.post('/dsa/progress', {
        question_id: notesModal.questionId,
        status: progress[notesModal.questionId]?.status || 'todo',
        notes: notesModal.notes,
      });
      setProgress((prev) => ({
        ...prev,
        [notesModal.questionId]: {
          ...prev[notesModal.questionId],
          notes: notesModal.notes,
        },
      }));
      setNotesModal({ open: false, questionId: null, notes: '' });
      toast.success('Notes saved!');
    } catch (err) {
      toast.error('Failed to save notes');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false;
    if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusIcon = (questionId) => {
    const status = progress[questionId]?.status;
    switch (status) {
      case 'solved': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'attempted': return <Clock className="w-5 h-5 text-amber-400" />;
      default: return <Circle className="w-5 h-5 text-surface-600" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">DSA Tracker</h1>
          <p className="text-surface-400 text-sm mt-1">Track your problem-solving progress</p>
        </div>
        {stats && (
          <div className="flex gap-3">
            <div className="glass-card px-4 py-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{stats.overall?.solved || 0}</p>
              <p className="text-xs text-surface-500">Solved</p>
            </div>
            <div className="glass-card px-4 py-2 text-center">
              <p className="text-lg font-bold text-amber-400">{stats.overall?.attempted || 0}</p>
              <p className="text-xs text-surface-500">Attempted</p>
            </div>
            <div className="glass-card px-4 py-2 text-center">
              <p className="text-lg font-bold text-surface-400">{stats.overall?.total || 0}</p>
              <p className="text-xs text-surface-500">Total</p>
            </div>
          </div>
        )}
      </div>

      {/* Topic tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TOPICS.map((topic) => {
          const topicStat = stats?.topic_stats?.find((t) => t.topic === topic);
          const isActive = selectedTopic === topic;
          return (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent'
              }`}
            >
              {topic}
              {topic !== 'All' && topicStat && (
                <span className="ml-2 text-xs opacity-60">{topicStat.solved || 0}/{topicStat.total}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="input-field pl-11 pr-10 appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
        </div>
      </div>

      {/* Questions table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-surface-800/30">
                <th className="w-12">Status</th>
                <th>Problem</th>
                <th className="w-28">Difficulty</th>
                <th className="hidden md:table-cell w-32">Topic</th>
                <th className="hidden lg:table-cell w-32">Platform</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id} className="group">
                  <td>
                    <button onClick={() => {
                      const current = progress[q.id]?.status;
                      const next = current === 'solved' ? 'todo' : current === 'attempted' ? 'solved' : 'attempted';
                      updateStatus(q.id, next);
                    }}>
                      {statusIcon(q.id)}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-200 group-hover:text-primary-400 transition-colors">
                        {q.title}
                      </span>
                      {q.url && (
                        <a href={q.url} target="_blank" rel="noopener noreferrer"
                           className="opacity-0 group-hover:opacity-100 transition-opacity text-surface-500 hover:text-primary-400">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    {q.company_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {q.company_tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 text-surface-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td><Badge variant={q.difficulty}>{q.difficulty}</Badge></td>
                  <td className="hidden md:table-cell text-surface-400 text-xs">{q.topic}</td>
                  <td className="hidden lg:table-cell text-surface-400 text-xs">{q.platform}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(q.id, 'solved')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          progress[q.id]?.status === 'solved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-surface-600 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title="Mark as solved"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => setNotesModal({ open: true, questionId: q.id, notes: progress[q.id]?.notes || '' })}
                        className={`p-1.5 rounded-lg transition-colors ${
                          progress[q.id]?.notes
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'text-surface-600 hover:text-primary-400 hover:bg-primary-500/10'
                        }`}
                        title="Add notes"
                      >
                        <StickyNote size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-surface-500">
            <p>No questions found matching your filters</p>
          </div>
        )}
      </Card>

      {/* Notes modal */}
      {notesModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNotesModal({ open: false, questionId: null, notes: '' })} />
          <div className="relative glass-card p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-semibold text-surface-100 mb-4">Problem Notes</h3>
            <textarea
              value={notesModal.notes}
              onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
              placeholder="Write your approach, key insights, or reminders..."
              className="input-field resize-none h-32 font-mono text-sm"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setNotesModal({ open: false, questionId: null, notes: '' })} className="btn-secondary text-sm !px-4 !py-2">Cancel</button>
              <button onClick={saveNotes} className="btn-primary text-sm !px-4 !py-2">Save Notes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DSATracker;
