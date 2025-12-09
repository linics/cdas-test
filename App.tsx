import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AssignmentList } from './components/AssignmentList';
import { StudentAssignmentView } from './components/StudentAssignmentView';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TeacherDashboard />} />
          <Route path="/assignments" element={<AssignmentList />} />
          <Route path="/assignment/:id" element={<StudentAssignmentView />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
