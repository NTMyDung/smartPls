<<<<<<< HEAD
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home.jsx';
import AnalysisPage from './pages/Analysis.jsx';
import TheoryPage from './pages/TheoryPage.jsx';
import InstructionPage from './pages/InstructionPage.jsx';
import MainLayout from './layouts/mainLayouts/MainLayout.jsx';
export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/phan-tich" element={<AnalysisPage />} />
        <Route path="/ly-thuyet" element={<TheoryPage />} />
        <Route path="/huong-dan-su-dung" element={<InstructionPage />} />
      </Routes>
    </MainLayout>
  );
=======
import { useState, useEffect } from 'react'
import UploadCSV from "./pages/UploadCSV";


function App() {
  return (
     <div>
      <UploadCSV />
    </div>
  )
>>>>>>> parent of 6b0ed1e (complete)
}

export default App
