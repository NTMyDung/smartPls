import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home.jsx';
import AnalysisPage from './pages/Analysis.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/phan-tich" element={<AnalysisPage />} />
      </Routes>
    </MainLayout>
  );
}
