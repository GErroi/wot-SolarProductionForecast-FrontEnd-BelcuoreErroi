import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
} from 'chart.js';
import './evaluate.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function Evaluate() {
    const location = useLocation();
    const navigate = useNavigate();
    const { data, data2 } = location.state || {};

    const handleBackToDashboard = () => {
        navigate('/');
    };

    if (!data || !Array.isArray(data) || data.length === 0) {
        return <div>Caricamento dati...</div>;
    }
    if (!data2) {
        return <div>Caricamento dei risultati del training...</div>;
    }

    const predictedValues = data.map((item) => item['predicted']);
    const realValues = data.map((item) => item['real']);

    const chartData = {
        datasets: [
            {
                label: 'Predicted Values',
                data: predictedValues.map((value, index) => ({ x: index + 1, y: value })),
                backgroundColor: 'rgba(255, 99, 132, 1)',
                borderColor: 'rgba(255, 99, 132, 0.7)',
                pointRadius: 8,
            },
            {
                label: 'Real Values',
                data: realValues.map((value, index) => ({ x: index + 1, y: value })),
                backgroundColor: 'rgba(54, 162, 235, 1)',
                borderColor: 'rgba(54, 162, 235, 0.7)',
                pointRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                title: {
                    display: true,
                    text: 'Watt/h (Wh)',
                    font: {
                        size: 14,
                    },
                    color: '#333',
                },
            },
        },
    };

    // Dati di K-Fold
    const { k_folds, mean_rmse, std_rmse, individual_fold_rmse } = data2.cross_validation_results;


    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button 
                    className="back-button"
                    onClick={handleBackToDashboard}
                >
                    Back to Dashboard
                </button>
            </div>
    
            <h1>Prediction Accuracy Overview
                <span id="Accuracy-Overview" className="info-icon">?</span>
                <ReactTooltip anchorId="Accuracy-Overview" content="This graph compares the predicted and observed values of instantaneous energy production, collected every 15 minutes. The data refer to 14 measurements." 
                 style={{fontSize: '18px'}}
                 />
            </h1>

            <div className="chart-evaluate">
                <Scatter data={chartData} options={chartOptions} />
            </div>
    
            <div className="results-row">
                <div className="result-box kfold-box">
                    <h3>
                        K-Fold Cross Validation Results
                        <span id="kfold-info" className="info-icon">?</span>
                        <ReactTooltip anchorId="kfold-info" content="Displays the Mean Squared Error (MSE) for each fold in K-fold cross-validation." />
                    </h3>
                    <p><strong>K-Folds:</strong> {k_folds}</p>
                    <p><strong>Mean RMSE:</strong> {mean_rmse.toFixed(2)}</p>
                    <p><strong>Standard Deviation of RMSE:</strong> {std_rmse.toFixed(2)}</p>

                    <h4>Individual Fold RMSE:</h4>
                    <ul>
                        {individual_fold_rmse.map((rmse, index) => (
                            <li key={index}>Fold {index + 1}: {rmse.toFixed(2)}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Evaluate;