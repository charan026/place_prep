import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 bg-mesh flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-surface-950 to-accent-cyan/10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">PlacePrep</h1>
              <p className="text-surface-400 text-sm">AI-Powered Platform</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-surface-100 leading-tight mb-6">
            Crack your dream<br />
            <span className="gradient-text">placement.</span>
          </h2>
          <p className="text-lg text-surface-400 max-w-md leading-relaxed">
            AI-powered resume analysis, mock interviews, DSA tracking, and company insights — everything you need in one platform.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Questions', value: '500+' },
              { label: 'Companies', value: '50+' },
              { label: 'AI Features', value: '3' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-surface-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent-cyan/5 blur-3xl" />
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">PlacePrep</h1>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-surface-100 mb-2">Welcome back</h2>
            <p className="text-surface-400 mb-8">Sign in to continue your preparation</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pl-11"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-surface-400 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
