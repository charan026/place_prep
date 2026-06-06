import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, GraduationCap, Briefcase, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    college: '', graduation_year: '', target_role: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college || undefined,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : undefined,
        target_role: form.target_role || undefined,
      });
      toast.success('Account created! Welcome aboard!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 bg-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">PlacePrep</h1>
            <p className="text-surface-500 text-xs">AI-Powered Platform</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-surface-100 mb-2">Create your account</h2>
          <p className="text-surface-400 mb-8">Start your placement preparation journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input name="name" type="text" value={form.name} onChange={handleChange}
                    placeholder="John Doe" className="input-field pl-11" required />
                </div>
              </div>
              <div>
                <label className="input-label">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="you@email.com" className="input-field pl-11" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="Min 6 characters" className="input-field pl-11" required />
                </div>
              </div>
              <div>
                <label className="input-label">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repeat password" className="input-field pl-11" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="input-label">College</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input name="college" type="text" value={form.college} onChange={handleChange}
                    placeholder="IIT Delhi" className="input-field pl-11" />
                </div>
              </div>
              <div>
                <label className="input-label">Grad Year</label>
                <input name="graduation_year" type="number" value={form.graduation_year} onChange={handleChange}
                  placeholder="2025" className="input-field" min="2020" max="2030" />
              </div>
              <div>
                <label className="input-label">Target Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input name="target_role" type="text" value={form.target_role} onChange={handleChange}
                    placeholder="SDE" className="input-field pl-11" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
