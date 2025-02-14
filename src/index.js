import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import Dasboard from './dashboard';
import Evaluate from './evaluate';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<Dasboard />} />
                <Route path="/evaluate" element={<Evaluate />} />
            </Routes>
        </Router>
    </React.StrictMode>
);
reportWebVitals();