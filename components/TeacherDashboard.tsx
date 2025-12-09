import React, { useState } from 'react';
import { generateAssignment } from '../services/geminiService';
import { saveAssignment } from '../services/dbService';
import { Assignment, Difficulty } from '../types';
import { useNavigate } from 'react-router-dom';

const SUBJECT_ICONS: Record<string, string> = {
  "数学": "📐", "物理": "⚡", "化学": "🧪", "生物": "🧬", 
  "历史": "🏛️", "地理": "🌍", "文学": "📚", "艺术": "🎨"
};

const PRESETS = [
  "火星殖民计划", "全球变暖与碳中和", "丝绸之路的贸易", 
  "从达芬奇到现代医学", "设计一个可持续城市", "微塑料对海洋的影响"
];

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSubject = (subject: string) => {
    setSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleGenerate = async () => {
    if (!topic || subjects.length === 0) {
      setError("请填写主题并至少选择一个学科。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generatedContent = await generateAssignment(topic, subjects, difficulty);
      const newAssignment: Assignment = {
        id: crypto.randomUUID(),
        topic,
        subjects,
        difficulty,
        content: generatedContent,
        created_at: new Date().toISOString()
      };
      saveAssignment(newAssignment);
      navigate('/assignments');
    } catch (err) {
      setError("生成失败，请稍后重试。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2">
          跨学科作业架构师
        </h1>
        <p className="text-lg text-gray-600">
          Agent A 已就绪。只需一个主题，为您构建深度融合的 PBL 探究任务。
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl border border-white/50 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
               <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-b-purple-500 rounded-full animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <h3 className="mt-6 text-xl font-bold text-gray-800">Agent A 正在思考...</h3>
            <p className="text-gray-500 mt-2">正在融合 {subjects.join(' + ')} 的知识点</p>
          </div>
        )}

        <div className="p-8 space-y-8">
          {/* Step 1: Topic */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-800 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs mr-2">1</span>
              探索主题 (Phenomenon)
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="输入任何感兴趣的现象或话题..."
                className="w-full text-lg rounded-xl border-gray-200 shadow-sm px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-3 top-3.5">
                <span className="text-2xl opacity-50">✨</span>
              </div>
            </div>
            
            {/* Presets */}
            <div className="flex flex-wrap gap-2 animate-fade-in-up">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide self-center mr-2">热门灵感:</span>
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => setTopic(p)}
                  className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 rounded-lg border border-gray-200 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Step 2: Subjects */}
          <div className="space-y-4">
             <label className="block text-lg font-semibold text-gray-800 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs mr-2">2</span>
              选择融合学科
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(SUBJECT_ICONS).map(([sub, icon]) => {
                const isSelected = subjects.includes(sub);
                return (
                  <button
                    key={sub}
                    onClick={() => toggleSubject(sub)}
                    className={`relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-105'
                        : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-3xl mb-2 filter drop-shadow-sm">{icon}</span>
                    <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {sub}
                    </span>
                    {isSelected && (
                       <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Step 3: Difficulty */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-800 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs mr-2">3</span>
              设置深度
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setDifficulty('basic')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  difficulty === 'basic' ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500' : 'border-gray-100 hover:border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">🌱 基础概念</span>
                  {difficulty === 'basic' && <span className="text-green-600">✓</span>}
                </div>
                <p className="text-sm text-gray-500">侧重于理解核心定义，建立学科之间的初步联系。</p>
              </div>

              <div 
                onClick={() => setDifficulty('challenge')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  difficulty === 'challenge' ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500' : 'border-gray-100 hover:border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">🚀 深度探究</span>
                  {difficulty === 'challenge' && <span className="text-orange-600">✓</span>}
                </div>
                <p className="text-sm text-gray-500">开放式问题，需要批判性思维、推理和创造性解决方案。</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center animate-pulse">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl text-white font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            开始生成作业架构
          </button>
        </div>
      </div>
    </div>
  );
};