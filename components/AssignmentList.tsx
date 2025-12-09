import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments } from '../services/dbService';
import { Assignment } from '../types';

export const AssignmentList: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setAssignments(getAssignments().reverse());
  }, []);

  const filteredAssignments = assignments.filter(a => 
    a.content.title.includes(filter) || 
    a.content.scenario.includes(filter) ||
    a.subjects.some(s => s.includes(filter))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900">任务控制中心</h2>
           <p className="text-gray-500 mt-1">选择一个跨学科挑战开始学习</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="搜索主题或学科..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <Link to="/" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </Link>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300 backdrop-blur-sm">
          <div className="text-6xl mb-4">🌪️</div>
          <p className="text-xl text-gray-500 font-medium">还没有生成的任务。</p>
          <Link to="/" className="mt-4 inline-block text-indigo-600 font-semibold hover:underline">去创建一个 &rarr;</Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <Link 
              key={assignment.id} 
              to={`/assignment/${assignment.id}`}
              className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className={`h-2 w-full ${assignment.difficulty === 'basic' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`} />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                    assignment.difficulty === 'basic' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {assignment.difficulty === 'basic' ? '基础认知' : '深度探究'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {assignment.content.title}
                </h3>
                
                <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                  {assignment.content.scenario}
                </p>

                <div className="border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    {assignment.subjects.slice(0, 3).map(sub => (
                      <span key={sub} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                        {sub}
                      </span>
                    ))}
                    {assignment.subjects.length > 3 && (
                      <span className="text-xs text-gray-400 self-center">+{assignment.subjects.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};