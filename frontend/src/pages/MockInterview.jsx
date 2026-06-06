import { useState, useEffect } from 'react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Select } from '../components/ui/Input';
import toast from 'react-hot-toast';
import {
  MessageSquare, Play, Send, CheckCircle, Clock,
  Brain, ArrowRight, ChevronRight, Star, History,
  Sparkles, AlertCircle
} from 'lucide-react';

const ROLES = [
  'Software Development Engineer (SDE)',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'ML Engineer',
  'DevOps Engineer',
  'Product Manager',
  'Data Analyst',
  'System Design Engineer',
];

const MockInterview = () => {
  const [mode, setMode] = useState('setup'); // setup | interview | results
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/interviews/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const startInterview = async () => {
    if (!role) return toast.error('Please select a role');
    setStarting(true);
    try {
      const res = await api.post('/interviews/start', { role, difficulty });
      setInterview(res.data);
      setMode('interview');
      setCurrentQuestion(0);
      setAnswers([]);
      toast.success('Interview started! Good luck!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start interview');
    } finally {
      setStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error('Please write an answer');
    setSubmitting(true);
    try {
      const res = await api.post(`/interviews/${interview.id}/answer`, {
        question_index: currentQuestion,
        answer_text: answer,
      });

      const feedback = res.data.ai_feedback ? JSON.parse(res.data.ai_feedback) : null;
      setAnswers((prev) => [...prev, { ...res.data, feedback }]);
      setAnswer('');

      const questions = interview.questions;
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        toast.success(`Answer submitted! Score: ${res.data.score}/10`);
      } else {
        // Last question — complete interview
        await completeInterview();
      }
    } catch (err) {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const completeInterview = async () => {
    setCompleting(true);
    try {
      const res = await api.post(`/interviews/${interview.id}/complete`);
      setInterview(res.data);
      setMode('results');
      fetchHistory();
      toast.success('Interview completed!');
    } catch (err) {
      toast.error('Failed to complete interview');
    } finally {
      setCompleting(false);
    }
  };

  const viewPastInterview = async (id) => {
    try {
      const res = await api.get(`/interviews/${id}`);
      setInterview(res.data);
      setAnswers(res.data.answers?.map((a) => ({
        ...a,
        feedback: a.ai_feedback ? (typeof a.ai_feedback === 'string' ? JSON.parse(a.ai_feedback) : a.ai_feedback) : null,
      })) || []);
      setMode('results');
    } catch (err) {
      toast.error('Failed to load interview');
    }
  };

  // Setup mode
  if (mode === 'setup') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Mock Interview</h1>
          <p className="text-surface-400 text-sm mt-1">Practice with an AI interviewer and get feedback</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Start new */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-violet to-purple-600 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-100">Start a New Interview</h2>
                  <p className="text-sm text-surface-400">Select your target role and difficulty</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Target Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
                    <option value="">Select a role...</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="input-label">Difficulty Level</label>
                  <div className="flex gap-3">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border
                          ${difficulty === d
                            ? d === 'easy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : d === 'medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-surface-800/50 text-surface-400 border-surface-700 hover:border-surface-500'
                          }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={startInterview} loading={starting} className="w-full mt-4">
                  <Play size={18} className="mr-2" /> Start Interview
                </Button>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-surface-800/30 border border-surface-700/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-surface-300">How it works</p>
                    <ul className="text-xs text-surface-500 mt-2 space-y-1">
                      <li>• AI generates 8 questions tailored to your role</li>
                      <li>• Answer each question in your own words</li>
                      <li>• Get instant AI feedback and scoring</li>
                      <li>• Receive an overall assessment at the end</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* History */}
          <div>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-surface-400" />
                <h3 className="text-sm font-semibold text-surface-300">Past Interviews</h3>
              </div>
              {loadingHistory ? (
                <LoadingSpinner size="sm" className="py-8" />
              ) : history.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-6">No interviews yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((h) => (
                    <button key={h.id} onClick={() => viewPastInterview(h.id)}
                      className="w-full text-left p-3 rounded-xl hover:bg-surface-800/50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-surface-200 truncate">{h.role}</p>
                        {h.overall_score && (
                          <Badge variant={h.overall_score >= 70 ? 'success' : h.overall_score >= 50 ? 'warning' : 'danger'}>
                            {h.overall_score}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={h.difficulty}>{h.difficulty}</Badge>
                        <span className="text-xs text-surface-500">{new Date(h.started_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Interview mode
  if (mode === 'interview' && interview) {
    const questions = interview.questions;
    const question = questions[currentQuestion];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">{interview.role}</h2>
            <p className="text-sm text-surface-400">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
          <Badge variant={interview.difficulty}>{interview.difficulty}</Badge>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Question */}
        <Card className="relative">
          <div className="absolute top-4 right-4">
            <Badge variant={question?.type === 'coding' ? 'info' : question?.type === 'behavioral' ? 'success' : question?.type === 'system_design' ? 'warning' : 'default'}>
              {question?.type?.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-400">Q{currentQuestion + 1}</span>
            </div>
            <p className="text-surface-100 font-medium leading-relaxed pt-1">{question?.question}</p>
          </div>

          {question?.hints && (
            <div className="mt-4 p-3 rounded-lg bg-surface-800/30 border border-surface-700/30">
              <p className="text-xs text-surface-500 font-medium mb-1">💡 Hints</p>
              <ul className="text-xs text-surface-500 space-y-0.5">
                {question.hints.map((hint, i) => <li key={i}>• {hint}</li>)}
              </ul>
            </div>
          )}
        </Card>

        {/* Answer */}
        <Card>
          <label className="input-label">Your Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... Be detailed and specific."
            className="input-field resize-none h-48 font-mono text-sm"
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-surface-500">{answer.length} characters</p>
            <div className="flex gap-3">
              {currentQuestion < questions.length - 1 ? (
                <Button onClick={submitAnswer} loading={submitting}>
                  Submit & Next <ChevronRight size={18} className="ml-1" />
                </Button>
              ) : (
                <Button onClick={submitAnswer} loading={submitting || completing}>
                  Submit & Finish <CheckCircle size={18} className="ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Previous answers feedback */}
        {answers.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-surface-300 mb-3">Previous Answers</h3>
            <div className="space-y-3">
              {answers.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/30">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                    ${a.score >= 7 ? 'bg-emerald-500/20 text-emerald-400' : a.score >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {a.score}
                  </div>
                  <p className="text-sm text-surface-400">Question {a.question_index + 1}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Results mode
  if (mode === 'results' && interview) {
    const overallFeedback = interview.overall_feedback
      ? (typeof interview.overall_feedback === 'string' ? JSON.parse(interview.overall_feedback) : interview.overall_feedback)
      : null;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Interview Results</h2>
            <p className="text-sm text-surface-400">{interview.role} — {interview.difficulty}</p>
          </div>
          <Button variant="secondary" onClick={() => { setMode('setup'); setInterview(null); setAnswers([]); }}>
            New Interview
          </Button>
        </div>

        {/* Overall score */}
        {overallFeedback && (
          <Card className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-violet/20 mb-4">
              <span className="text-3xl font-bold gradient-text">{overallFeedback.overall_score}</span>
            </div>
            <p className="text-surface-200 font-medium mb-2">{overallFeedback.summary}</p>
            <Badge variant={overallFeedback.recommendation === 'hire' ? 'success' : overallFeedback.recommendation === 'lean_hire' ? 'info' : 'warning'}>
              {overallFeedback.recommendation?.replace('_', ' ').toUpperCase()}
            </Badge>

            {overallFeedback.next_steps && (
              <div className="mt-4 text-left p-4 rounded-xl bg-surface-800/30">
                <p className="text-sm font-medium text-surface-300 mb-2">Next Steps</p>
                <ul className="text-sm text-surface-400 space-y-1">
                  {overallFeedback.next_steps.map((step, i) => <li key={i}>• {step}</li>)}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* Individual answers */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-surface-300">Question-wise Feedback</h3>
          {answers.map((a, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${a.score >= 7 ? 'bg-emerald-500/20 text-emerald-400' : a.score >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {a.score}
                  </div>
                  <p className="text-sm font-medium text-surface-200">
                    {interview.questions?.[a.question_index]?.question || `Question ${a.question_index + 1}`}
                  </p>
                </div>
                <span className="text-xs text-surface-500">{a.score}/10</span>
              </div>

              {a.feedback && (
                <div className="ml-11 space-y-2">
                  <p className="text-sm text-surface-400">{a.feedback.feedback}</p>
                  {a.feedback.model_answer_summary && (
                    <div className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/10">
                      <p className="text-xs font-medium text-primary-400 mb-1">Model Answer</p>
                      <p className="text-xs text-surface-400">{a.feedback.model_answer_summary}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default MockInterview;
