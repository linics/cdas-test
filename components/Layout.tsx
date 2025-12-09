import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => 
    location.pathname === path 
      ? "text-indigo-600 bg-indigo-50/80 border-indigo-200" 
      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 border-transparent";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans text-gray-900">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-200/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex-shrink-0 flex items-center group">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-2 group-hover:bg-indigo-700 transition-colors shadow-indigo-200 shadow-lg">
                  C
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                  CDAS 智能体
                </span>
              </Link>
              <div className="hidden sm:flex sm:space-x-4">
                <Link 
                  to="/" 
                  className={`inline-flex items-center px-4 py-2 border rounded-full text-sm font-medium transition-all duration-200 ${isActive('/')}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  教师控制台
                </Link>
                <Link 
                  to="/assignments" 
                  className={`inline-flex items-center px-4 py-2 border rounded-full text-sm font-medium transition-all duration-200 ${isActive('/assignments')}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  学生作业中心
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="hidden md:flex flex-col items-end mr-2">
                 <span className="text-xs font-semibold text-gray-700">现象式学习系统</span>
                 <span className="text-[10px] text-gray-400">Powered by Gemini 2.5</span>
               </div>
               <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-1 font-mono">v1.2 Pro</span>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <div className="sm:hidden flex justify-around border-t border-gray-100 bg-white/50 backdrop-blur-sm">
            <Link to="/" className="flex-1 text-center py-3 text-sm font-medium text-gray-600 active:bg-gray-50">教师端</Link>
            <Link to="/assignments" className="flex-1 text-center py-3 text-sm font-medium text-gray-600 active:bg-gray-50">学生端</Link>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500 ease-in-out">
        {children}
      </main>
      
      <footer className="mt-auto border-t border-gray-200 bg-white/40 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-gray-400 text-sm">
          <span>© 2025 Cross-Disciplinary Agent System</span>
          <div className="flex space-x-4">
             <span>React 19</span>
             <span>•</span>
             <span>Tailwind</span>
             <span>•</span>
             <span>Gemini API</span>
          </div>
        </div>
      </footer>
    </div>
  );
};