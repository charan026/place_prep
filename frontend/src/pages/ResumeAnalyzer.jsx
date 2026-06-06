import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Sparkles, CheckCircle, AlertTriangle,
  Lightbulb, TrendingUp, ArrowRight, Trash2
} from 'lucide-react';

const ScoreRing = ({ score, size = 120, label }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="score-ring">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1e293b" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-bold text-surface-100">{score}</span>
        <span className="text-xs text-surface-500">/ 100</span>
      </div>
      {label && <p className="text-sm text-surface-400 mt-2">{label}</p>}
    </div>
  );
};

const ResumeAnalyzer = () => {
  const [resumes, setResumes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data);
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    try {
      const res = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumes((prev) => [res.data, ...prev]);
      toast.success('Resume uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleAnalyze = async (resumeId) => {
    setAnalyzing(true);
    setSelectedResume(resumeId);
    try {
      const res = await api.post(`/resumes/${resumeId}/analyze`);
      setAnalysis(res.data);
      toast.success('Analysis complete!');
      fetchResumes(); // refresh scores
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const viewAnalysis = async (resumeId) => {
    setSelectedResume(resumeId);
    try {
      const res = await api.get(`/resumes/${resumeId}/analysis`);
      setAnalysis(res.data);
    } catch (err) {
      setAnalysis(null);
      toast.error('No analysis found. Click "Analyze" to generate one.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Resume Analyzer</h1>
        <p className="text-surface-400 text-sm mt-1">Upload your resume and get AI-powered feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload + History */}
        <div className="space-y-6">
          {/* Upload zone */}
          <Card className="!p-0 overflow-hidden">
            <div
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all
                ${isDragActive ? 'border-primary-500 bg-primary-500/5' : 'border-surface-700 hover:border-surface-500'}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                {uploading ? (
                  <LoadingSpinner size="md" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-surface-200">
                    {uploading ? 'Uploading...' : isDragActive ? 'Drop your resume here' : 'Upload Resume'}
                  </p>
                  <p className="text-xs text-surface-500 mt-1">PDF files only, max 5MB</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Resume history */}
          <Card>
            <h3 className="text-sm font-semibold text-surface-300 mb-4">Upload History</h3>
            <div className="space-y-3">
              {resumes.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">No resumes uploaded yet</p>
              ) : (
                resumes.map((resume) => (
                  <div key={resume.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                      ${selectedResume === resume.id ? 'bg-primary-500/10 border border-primary-500/30' : 'hover:bg-surface-800/50 border border-transparent'}`}
                    onClick={() => viewAnalysis(resume.id)}
                  >
                    <FileText className="w-8 h-8 text-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-200 truncate">{resume.filename}</p>
                      <p className="text-xs text-surface-500">{new Date(resume.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    {resume.overall_score ? (
                      <Badge variant={resume.overall_score >= 70 ? 'success' : resume.overall_score >= 50 ? 'warning' : 'danger'}>
                        {resume.overall_score}
                      </Badge>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAnalyze(resume.id); }}
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                      >
                        Analyze
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Analysis results */}
        <div className="lg:col-span-2">
          {analyzing ? (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
              <p className="text-surface-400 mt-4">Analyzing your resume with AI...</p>
              <p className="text-xs text-surface-500 mt-1">This may take 10-20 seconds</p>
            </Card>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Score section */}
              <Card>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative">
                    <ScoreRing score={analysis.overall_score} label="Overall Score" />
                  </div>
                  <div className="relative">
                    <ScoreRing score={analysis.ats_score} size={100} label="ATS Score" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-semibold text-surface-100">Resume Analysis</h3>
                    <p className="text-sm text-surface-400">
                      {analysis.overall_score >= 80 ? 'Excellent resume! Minor improvements can make it even better.' :
                       analysis.overall_score >= 60 ? 'Good foundation. Focus on the suggestions below to improve.' :
                       'Your resume needs significant improvements. Follow the suggestions carefully.'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-emerald-400">Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {(analysis.strengths || []).map((s, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-surface-200">{s.title}</p>
                          <p className="text-xs text-surface-500 mt-0.5">{s.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-semibold text-amber-400">Areas to Improve</h3>
                  </div>
                  <div className="space-y-3">
                    {(analysis.weaknesses || []).map((w, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-surface-200">{w.title}</p>
                          <p className="text-xs text-surface-500 mt-0.5">{w.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Suggestions */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-primary-400" />
                  <h3 className="text-sm font-semibold text-primary-400">Suggestions</h3>
                </div>
                <div className="space-y-4">
                  {(analysis.suggestions || []).map((s, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface-800/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-surface-200">{s.section}</p>
                          <Badge variant={s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warning' : 'info'}>
                            {s.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-surface-400">{s.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-surface-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-300">No Analysis Selected</h3>
              <p className="text-sm text-surface-500 mt-2 max-w-xs text-center">
                Upload a resume and click "Analyze" to get AI-powered feedback on your resume
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
