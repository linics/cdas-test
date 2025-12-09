import React, { useState, useEffect } from 'react';
import { generateAssignment } from '../services/geminiService';
import { saveAssignment, saveCustomKnowledgeBase, getCustomKnowledgeBase, clearCustomKnowledgeBase } from '../services/dbService';
import { Assignment, Difficulty, StagedFile } from '../types';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_CURRICULUM_STANDARDS } from '../data/defaultCurriculum';

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
  
  // Knowledge Base State
  const [kbMode, setKbMode] = useState<'system' | 'custom'>('system');
  const [customKbData, setCustomKbData] = useState<{ fileName: string, content: string } | null>(null);
  
  // File Staging State (Advanced multi-file management)
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // Load persisted custom KB on mount
  useEffect(() => {
    const savedKb = getCustomKnowledgeBase();
    if (savedKb) {
      setCustomKbData(savedKb);
      setKbMode('custom');
    }
  }, []);

  const toggleSubject = (subject: string) => {
    setSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  // --- Advanced File Parsers ---

  const parsePdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 30); // Limit pages for performance
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return fullText;
    } catch (e) {
      throw new Error("PDF 解析失败 (PDF Parse Failed)");
    }
  };

  const parseDocx = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return result.value;
    } catch (e) {
      throw new Error("Word 解析失败 (Docx Parse Failed)");
    }
  };

  const parseText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Text read failed"));
      reader.readAsText(file);
    });
  };

  // --- File Handler Logic ---

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles: StagedFile[] = Array.from(e.target.files).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'pending'
    }));

    setStagedFiles(prev => [...prev, ...newFiles]);
    setIsProcessingFiles(true);

    // Process queue
    for (const staged of newFiles) {
      updateFileStatus(staged.id, 'parsing');
      try {
        let content = '';
        const f = staged.file;
        
        if (f.type === 'application/pdf') {
          content = await parsePdf(f);
        } else if (f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          content = await parseDocx(f);
        } else {
          content = await parseText(f);
        }

        updateFileStatus(staged.id, 'success', content);
      } catch (err) {
        updateFileStatus(staged.id, 'error', undefined, (err as Error).message);
      }
    }
    setIsProcessingFiles(false);
    // Reset input
    e.target.value = ''; 
  };

  const updateFileStatus = (id: string, status: StagedFile['status'], content?: string, errorMsg?: string) => {
    setStagedFiles(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, status, content, errorMessage: errorMsg };
      }
      return f;
    }));
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleMergeAndSave = () => {
    const successFiles = stagedFiles.filter(f => f.status === 'success');
    if (successFiles.length === 0) return;

    const mergedContent = successFiles.map(f => `--- FILE: ${f.file.name} ---\n${f.content}`).join('\n\n');
    const mergedNames = successFiles.map(f => f.file.name).join(' + ');
    
    saveCustomKnowledgeBase(mergedContent, mergedNames);
    setCustomKbData({ fileName: mergedNames, content: mergedContent });
    setKbMode('custom');
    setStagedFiles([]); // Clear staging
    alert(`成功集成 ${successFiles.length} 个文件到系统知识库！`);
  };

  // --- Main Generator Logic ---

  const handleGenerate = async () => {
    if (!topic || subjects.length === 0) {
      setError("请填写主题并至少选择一个学科。");
      return;
    }

    setLoading(true);
    setError(null);

    // Determine final KB content
    let finalKbContent = "";
    let standardRefStr = "";

    if (kbMode === 'system') {
      finalKbContent = DEFAULT_CURRICULUM_STANDARDS;
      standardRefStr = "2022新课标 (内置)";
    } else if (kbMode === 'custom' && customKbData) {
      finalKbContent = customKbData.content;
      standardRefStr = customKbData.fileName;
    }

    // Append any staged files that haven't been saved to default but are sitting in the list
    const tempFiles = stagedFiles.filter(f => f.status === 'success');
    if (tempFiles.length > 0) {
      finalKbContent += "\n\n--- 临时补充资料 ---\n" + tempFiles.map(f => f.content).join('\n');
      standardRefStr += ` + [${tempFiles.length}个临时文件]`;
    }

    try {
      const generatedContent = await generateAssignment(topic, subjects, difficulty, finalKbContent);
      
      const newAssignment: Assignment = {
        id: crypto.randomUUID(),
        topic,
        subjects,
        difficulty,
        content: generatedContent,
        created_at: new Date().toISOString(),
        standards_ref: standardRefStr
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

  const handleResetDefault = () => {
    if (confirm("确定要删除自定义知识库并恢复系统预置内容吗？")) {
      clearCustomKnowledgeBase();
      setCustomKbData(null);
      setKbMode('system');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2">
          跨学科作业架构师
        </h1>
        <p className="text-lg text-gray-600">
          Agent A 已就绪。
          {kbMode === 'custom' ? (
             <span>当前基于 <span className="text-indigo-600 font-bold" title={customKbData?.fileName}>自定义知识库</span>。</span>
          ) : (
             <span>基于 <span className="text-green-600 font-bold">2022 新课标 (内置版)</span>。</span>
          )}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl border border-white/50 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="mt-6 text-xl font-bold text-gray-800">Agent A 正在构建教学场景...</h3>
          </div>
        )}

        <div className="p-8 space-y-8">
          
          {/* Section: Knowledge Base Configuration (Enhanced) */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-semibold text-gray-800 flex items-center">
                 <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 RAG 知识库挂载 (Knowledge Base)
              </label>
              {customKbData && (
                <button 
                  onClick={handleResetDefault}
                  className="text-xs text-red-500 hover:text-red-700 underline bg-white px-2 py-1 rounded border border-red-100"
                >
                  重置为系统默认
                </button>
              )}
            </div>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${kbMode === 'system' ? 'border-green-500 bg-green-50/50 ring-1 ring-green-200' : 'border-gray-200 bg-white opacity-60'}`}
                onClick={() => setKbMode('system')}
              >
                 <div className="font-bold text-gray-800 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${kbMode === 'system' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    系统内置知识库
                 </div>
                 <div className="text-xs text-gray-500 mt-1 pl-5">2022 义务教育课程标准摘要 (全学科)</div>
              </div>

              <div 
                 className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${kbMode === 'custom' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200' : 'border-gray-200 bg-white'}`}
                 onClick={() => customKbData ? setKbMode('custom') : null}
              >
                  <div className="font-bold text-gray-800 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${kbMode === 'custom' ? 'bg-indigo-500' : 'bg-gray-300'}`}></span>
                    自定义/混合知识库
                 </div>
                 <div className="text-xs text-gray-500 mt-1 pl-5 truncate" title={customKbData?.fileName}>
                    {customKbData ? customKbData.fileName : '暂无数据，请在下方构建'}
                 </div>
              </div>
            </div>

            {/* File Staging Area */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-bold text-gray-700">文件暂存与解析台</h5>
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center shadow-sm">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      添加文件
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".txt,.md,.pdf,.docx,.csv" 
                        multiple 
                        onChange={handleMultiFileUpload} 
                        disabled={isProcessingFiles}
                      />
                  </label>
              </div>

              {stagedFiles.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <span className="text-gray-400 text-sm">支持拖拽或点击添加 PDF, Word, TXT, CSV</span>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {stagedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="flex items-center overflow-hidden">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 mr-2">
                           {file.file.name.split('.').pop()?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.file.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({(file.file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                         {file.status === 'parsing' && <span className="text-xs text-amber-600 animate-pulse">解析中...</span>}
                         {file.status === 'success' && <span className="text-xs text-green-600 font-medium">✔ 就绪</span>}
                         {file.status === 'error' && <span className="text-xs text-red-500" title={file.errorMessage}>✘ 失败</span>}
                         
                         <button onClick={() => removeStagedFile(file.id)} className="text-gray-400 hover:text-red-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stagedFiles.some(f => f.status === 'success') && (
                 <div className="flex justify-end pt-3 border-t border-gray-100">
                    <button 
                      onClick={handleMergeAndSave}
                      className="text-sm bg-gray-900 hover:bg-black text-white px-4 py-2 rounded font-medium shadow transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                      打包并设为系统默认知识库
                    </button>
                 </div>
              )}
            </div>
          </div>

          {/* Steps 1, 2, 3... */}
          <div className="h-px bg-gray-100 w-full" />

          {/* Step 2: Topic */}
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

          {/* Step 3: Subjects */}
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

          {/* Step 4: Difficulty */}
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
                  <span className="font-bold text-gray-900">🌱 基础认知</span>
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