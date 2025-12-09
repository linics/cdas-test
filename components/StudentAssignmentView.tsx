import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAssignmentById, saveSubmission } from '../services/dbService';
import { evaluateSubmission, generateHint } from '../services/geminiService';
import { Assignment, Submission } from '../types';

const translateDimension = (val: string) => {
  if (val === 'High') return '高';
  if (val === 'Medium') return '中';
  if (val === 'Low') return '低';
  return val;
};

export const StudentAssignmentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | undefined>();
  const [answerText, setAnswerText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  
  // Hint State
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getAssignmentById(id);
      setAssignment(found);
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!assignment || (!answerText && !imageBase64)) return;
    setIsSubmitting(true);
    try {
      const evaluation = await evaluateSubmission(assignment.content, answerText, imageBase64);
      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        assignment_id: assignment.id,
        student_name: "学生用户",
        content_text: answerText,
        image_url: imageBase64,
        ai_evaluation: evaluation,
        created_at: new Date().toISOString()
      };
      saveSubmission(newSubmission);
      setSubmissionResult(newSubmission);
    } catch (error) {
      console.error(error);
      alert("评估失败，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    if (!assignment) return;
    setLoadingHint(true);
    try {
      const hintText = await generateHint(assignment.content, answerText);
      setHint(hintText);
    } finally {
      setLoadingHint(false);
    }
  };

  if (!assignment) return <div className="text-center p-8">正在加载任务数据...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
      {/* Left Column: Mission Content (Scrollable) */}
      <div className="lg:col-span-5 h-full overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">
        <div className="bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl p-8 border border-white/50">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
             {assignment.subjects.map(s => (
                <span key={s} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {s}
                </span>
              ))}
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${assignment.difficulty === 'basic' ? 'border-green-200 text-green-700' : 'border-orange-200 text-orange-700'}`}>
                {assignment.difficulty === 'basic' ? 'Lv.1 基础' : 'Lv.2 挑战'}
              </span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">{assignment.content.title}</h1>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-indigo-200 rounded-full opacity-20 blur-xl"></div>
             <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-3 flex items-center">
               <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span> 
               任务背景 (Scenario)
             </h3>
             <p className="text-gray-700 italic leading-relaxed font-serif text-lg">
               "{assignment.content.scenario}"
             </p>
          </div>

          <div className="space-y-6">
            {assignment.content.tasks.map((task) => (
              <div key={task.id} className="group relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="absolute -left-3 top-4 bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-md ring-2 ring-white">
                  {task.id}
                </div>
                <div className="ml-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase">{task.subject_focus}</span>
                  </div>
                  <p className="text-gray-900 font-medium text-lg">{task.question}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">考核知识点 (Knowledge Graph)</h4>
            <div className="flex flex-wrap gap-2">
              {assignment.content.evaluation_criteria.knowledge_points.map((kp, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                  {kp}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Workspace & Feedback */}
      <div className="lg:col-span-7 h-full flex flex-col">
        {!submissionResult ? (
          <div className="bg-white shadow-xl rounded-2xl flex flex-col h-full border border-gray-200 overflow-hidden relative">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                工作区
              </h2>
              
              {/* Agent C Trigger */}
              <button 
                onClick={handleGetHint}
                disabled={loadingHint}
                className="text-sm flex items-center text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                {loadingHint ? '连接 Agent C...' : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    AI 助教提示
                  </>
                )}
              </button>
            </div>

            {/* Hint Box Display */}
            {hint && (
              <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-start animate-fade-in-down">
                <span className="text-xl mr-3">💡</span>
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium mb-1">Agent C 的提示：</p>
                  <p className="text-sm text-amber-900">{hint}</p>
                </div>
                <button onClick={() => setHint(null)} className="text-amber-400 hover:text-amber-600">×</button>
              </div>
            )}

            <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-4">
              <textarea
                className="flex-1 w-full resize-none border-0 focus:ring-0 text-gray-800 placeholder-gray-300 text-lg leading-relaxed"
                placeholder="在这里写下你的思考..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                style={{ minHeight: '200px' }}
              />
              
              {imageBase64 && (
                <div className="relative group w-fit">
                   <img src={imageBase64} className="h-40 w-auto rounded-lg shadow-md border" alt="Upload" />
                   <button 
                     onClick={() => { setImageBase64(undefined); setImageFile(null); }}
                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
               <div className="flex items-center">
                 <label htmlFor="image-upload" className="cursor-pointer text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                 </label>
                 <span className="text-xs text-gray-400 ml-2">支持手写笔记拍照</span>
               </div>
               
               <button
                 onClick={handleSubmit}
                 disabled={isSubmitting || (!answerText && !imageBase64)}
                 className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                    isSubmitting || (!answerText && !imageBase64)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
                 }`}
               >
                 {isSubmitting ? 'Agent B 正在批阅...' : '提交作业'}
               </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-2xl rounded-2xl flex flex-col h-full overflow-hidden animate-fade-in-up border border-green-100">
             <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
               <h2 className="text-xl font-bold relative z-10 opacity-90">评估完成</h2>
               <div className="mt-4 relative z-10 flex flex-col items-center">
                  <span className="text-6xl font-black tracking-tighter drop-shadow-md">{submissionResult.ai_evaluation?.score}</span>
                  <span className="text-emerald-100 text-sm font-medium uppercase tracking-widest mt-1">Total Score</span>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 bg-white">
                <div className="mb-8 text-center">
                  <p className="text-lg text-gray-700 font-medium italic">
                    "{submissionResult.ai_evaluation?.feedback_summary}"
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                   {[
                     { label: '知识准确度', val: translateDimension(submissionResult.ai_evaluation?.dimensions.accuracy || ''), color: 'blue' },
                     { label: '创新思维', val: translateDimension(submissionResult.ai_evaluation?.dimensions.creativity || ''), color: 'purple' },
                     { label: '努力程度', val: submissionResult.ai_evaluation?.dimensions.effort_detected ? '优秀' : '待提升', color: 'orange' }
                   ].map((stat, idx) => (
                     <div key={idx} className={`bg-${stat.color}-50 p-4 rounded-xl text-center border border-${stat.color}-100`}>
                        <div className={`text-${stat.color}-800 font-bold text-lg`}>{stat.val}</div>
                        <div className={`text-${stat.color}-600/70 text-xs uppercase font-bold mt-1`}>{stat.label}</div>
                     </div>
                   ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 border-l-4 border-emerald-500 pl-3">详细建议</h3>
                  <ul className="space-y-4">
                    {submissionResult.ai_evaluation?.detailed_comments.map((comment, idx) => (
                      <li key={idx} className="flex bg-gray-50 p-4 rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 mr-3 shadow-sm">{idx + 1}</span>
                        <p className="text-gray-700 text-sm leading-relaxed">{comment}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <button 
                    onClick={() => { setSubmissionResult(null); setAnswerText(''); setImageBase64(undefined); setImageFile(null); setHint(null); }}
                    className="text-gray-500 hover:text-indigo-600 font-medium text-sm transition-colors"
                  >
                    ↺ 再次挑战此任务
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};