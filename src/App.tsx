import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Problems from './pages/Problems';
import Practice from './pages/Practice';
import PracticeWorkspace from './pages/PracticeWorkspace';
import Feedback from './pages/Feedback';

function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-800 flex flex-col selection:bg-slate-900 selection:text-white">
        <Routes>
          {/* Home and Problems share the same Navbar */}
          <Route path="/" element={
            <>
              <Navbar />
              <Home />
            </>
          } />
          <Route path="/problems" element={
            <>
              <Navbar />
              <Problems />
            </>
          } />
          <Route path="/practice" element={
            <>
              <Navbar />
              <Practice />
            </>
          } />
          
          {/* PracticeWorkspace and Feedback are focused views - NO NAVBAR */}
          <Route path="/practice/:problemId" element={<PracticeWorkspace />} />
          <Route path="/feedback/:problemId" element={<Feedback />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
