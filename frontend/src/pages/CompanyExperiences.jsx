import { useState, useEffect } from 'react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Building2, Search, Plus, MapPin, Calendar, Trophy,
  Users, ChevronRight, Briefcase, X
} from 'lucide-react';

const CompanyExperiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: '', role: '', experience_type: 'on-campus',
    difficulty: 'medium', tips: '', result: 'selected', year: new Date().getFullYear(),
    rounds: [{ round: 1, type: 'Online Assessment', description: '' }],
    questions_asked: [''],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, compRes] = await Promise.all([
        api.get('/experiences'),
        api.get('/experiences/companies'),
      ]);
      setExperiences(expRes.data);
      setCompanies(compRes.data);
    } catch (err) {
      toast.error('Failed to load experiences');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.role) return toast.error('Company and role are required');
    setSubmitting(true);
    try {
      await api.post('/experiences', {
        ...form,
        rounds: form.rounds.filter((r) => r.description),
        questions_asked: form.questions_asked.filter((q) => q),
      });
      toast.success('Experience shared! Thanks for contributing!');
      setShowForm(false);
      setForm({
        company_name: '', role: '', experience_type: 'on-campus',
        difficulty: 'medium', tips: '', result: 'selected', year: new Date().getFullYear(),
        rounds: [{ round: 1, type: 'Online Assessment', description: '' }],
        questions_asked: [''],
      });
      fetchData();
    } catch (err) {
      toast.error('Failed to share experience');
    } finally {
      setSubmitting(false);
    }
  };

  const addRound = () => {
    setForm({
      ...form,
      rounds: [...form.rounds, { round: form.rounds.length + 1, type: '', description: '' }],
    });
  };

  const addQuestion = () => {
    setForm({ ...form, questions_asked: [...form.questions_asked, ''] });
  };

  const filteredExperiences = searchQuery
    ? experiences.filter((e) =>
        e.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : experiences;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Interview Experiences</h1>
          <p className="text-surface-400 text-sm mt-1">Learn from real interview experiences</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} className="mr-2" /> Share Experience
        </Button>
      </div>

      {/* Company cards */}
      {companies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {companies.slice(0, 6).map((c) => (
            <button key={c.company_name} onClick={() => setSearchQuery(c.company_name)}
              className="glass-card-hover p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-violet/20 flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-sm font-medium text-surface-200 truncate">{c.company_name}</p>
              <p className="text-xs text-surface-500 mt-1">{c.experience_count} exp.</p>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input type="text" placeholder="Search by company or role..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-11" />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Experience list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExperiences.map((exp) => (
          <Card key={exp.id} hover onClick={() => setSelectedExperience(exp)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-surface-100">{exp.company_name}</h3>
                  <p className="text-xs text-surface-400">{exp.role}</p>
                </div>
              </div>
              <Badge variant={exp.result === 'selected' ? 'success' : exp.result === 'rejected' ? 'danger' : 'warning'}>
                {exp.result}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-500">
              <span className="flex items-center gap-1"><Briefcase size={12} /> {exp.experience_type}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {exp.year}</span>
              <Badge variant={exp.difficulty}>{exp.difficulty}</Badge>
            </div>
            {exp.author_name && (
              <p className="text-xs text-surface-600 mt-3">by {exp.author_name} {exp.author_college ? `• ${exp.author_college}` : ''}</p>
            )}
          </Card>
        ))}
      </div>

      {filteredExperiences.length === 0 && (
        <Card className="text-center py-12">
          <Building2 className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400">No experiences found</p>
          <p className="text-xs text-surface-500 mt-1">Be the first to share!</p>
        </Card>
      )}

      {/* Experience detail modal */}
      <Modal isOpen={!!selectedExperience} onClose={() => setSelectedExperience(null)}
        title={selectedExperience ? `${selectedExperience.company_name} — ${selectedExperience.role}` : ''} maxWidth="max-w-3xl">
        {selectedExperience && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Badge variant={selectedExperience.result === 'selected' ? 'success' : 'danger'}>{selectedExperience.result}</Badge>
              <Badge variant={selectedExperience.difficulty}>{selectedExperience.difficulty}</Badge>
              <Badge variant="info">{selectedExperience.experience_type}</Badge>
              <Badge variant="default">{selectedExperience.year}</Badge>
            </div>

            {/* Rounds */}
            {selectedExperience.rounds?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-300 mb-3">Interview Rounds</h4>
                <div className="space-y-3">
                  {selectedExperience.rounds.map((round, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface-800/30">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-400">{round.round || i + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-200">{round.type}</p>
                        <p className="text-sm text-surface-400 mt-1">{round.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            {selectedExperience.questions_asked?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-300 mb-3">Questions Asked</h4>
                <ul className="space-y-2">
                  {selectedExperience.questions_asked.map((q, i) => (
                    <li key={i} className="flex gap-2 text-sm text-surface-400">
                      <ChevronRight size={16} className="text-primary-400 flex-shrink-0 mt-0.5" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {selectedExperience.tips && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-sm font-semibold text-amber-400 mb-2">💡 Tips</h4>
                <p className="text-sm text-surface-400">{selectedExperience.tips}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Share experience modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Share Your Experience" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Company *</label>
              <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="input-field" placeholder="Google" required />
            </div>
            <div>
              <label className="input-label">Role *</label>
              <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field" placeholder="SDE-1" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Type</label>
              <select value={form.experience_type} onChange={(e) => setForm({ ...form, experience_type: e.target.value })} className="input-field">
                <option value="on-campus">On-Campus</option>
                <option value="off-campus">Off-Campus</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="input-label">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="input-field">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="input-label">Result</label>
              <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className="input-field">
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Rounds */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label !mb-0">Interview Rounds</label>
              <button type="button" onClick={addRound} className="text-xs text-primary-400 hover:text-primary-300">+ Add Round</button>
            </div>
            {form.rounds.map((round, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={round.type} placeholder="Round type"
                  onChange={(e) => {
                    const newRounds = [...form.rounds];
                    newRounds[i].type = e.target.value;
                    setForm({ ...form, rounds: newRounds });
                  }} className="input-field w-1/3" />
                <input type="text" value={round.description} placeholder="Description"
                  onChange={(e) => {
                    const newRounds = [...form.rounds];
                    newRounds[i].description = e.target.value;
                    setForm({ ...form, rounds: newRounds });
                  }} className="input-field flex-1" />
              </div>
            ))}
          </div>

          <div>
            <label className="input-label">Tips & Advice</label>
            <textarea value={form.tips} onChange={(e) => setForm({ ...form, tips: e.target.value })}
              className="input-field resize-none h-20" placeholder="Share any tips or advice..." />
          </div>

          <Button type="submit" loading={submitting} className="w-full">Share Experience</Button>
        </form>
      </Modal>
    </div>
  );
};

export default CompanyExperiences;
