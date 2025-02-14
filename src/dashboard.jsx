import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import './dashboard.css';
import { Tooltip } from 'react-tooltip';
import { format } from 'date-fns';


const Dashboard = () => {
    const [data, setData] = useState({
        dailyPrediction: [],
        hourlyPrediction: [],
        minutelyPrediction: []
    });

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedHour, setSelectedHour] = useState(null);
    const [selectedMinute, setSelectedMinute] = useState(null);
    const [solarProduction, setSolarProduction] = useState(null);
    const [temperature, setTemperature] = useState(null);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [verificationData, setVerificationData] = useState([]);


    const handleEvaluate = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8000/evaluateResults');
            const data = response.data
            const response2 = await axios.get('http://localhost:8000/trainingResults');
            const data2 = response2.data
            setIsLoading(false);
            navigate('/evaluate', { state: { data, data2 } });
        } catch (error) {
            setIsLoading(false);
            console.error('Errore nella chiamata API:', error);
        }
    };


    const fetchData = async () => {
        try {
            setIsLoading(true);
            await axios.post('http://localhost:8000/uploadCsv');
            await new Promise(resolve => setTimeout(resolve, 3000));
            const response = await axios.get('http://localhost:8000/downloadCsv');
            const dailyPrediction = response.data.daily_prediction_final || [];
            const hourlyPrediction = response.data.hourly_prediction_final || [];
            const minutelyPrediction = response.data.minutely_prediction_final || [];
            const verification = response.data.forecasts_verification_daily || [];
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            yesterday.setHours(23, 59, 59, 999);
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            const filteredVerification = verification
            .filter(item => {
                const itemDate = new Date(item.date);
                return (
                    itemDate >= sevenDaysAgo &&
                    itemDate <= yesterday &&
                    item.effective_state !== "unavailable" &&
                    item.effective_state !== 0
                );
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

            setVerificationData(filteredVerification);

            setData({
                dailyPrediction,
                hourlyPrediction,
                minutelyPrediction
            });

            // Imposta la data selezionata come null inizialmente
            if (dailyPrediction.length > 0) {
                setSelectedDate(null);
            }

            if (hourlyPrediction.length > 0) {
                setSelectedDate(null);
            }

            if (minutelyPrediction.length > 0) {
                setSelectedDate(null);
            }

            // Token di autorizzazione
            const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI1MDdmNjliNjA0MmY0M2M1OTk0NjVmZDRiZmZlMWZjNyIsImlhdCI6MTcyNDc1MTMxMywiZXhwIjoyMDQwMTExMzEzfQ.S61REKbuTL1l4yP-iIQRDuZvyCmGWDJoL7-FQXAl7xg";


            // Chiamata API per la produzione solare in tempo reale
            const solarProductionResponse = await axios.get('https://gdfhome.duckdns.org/api/states/sensor.fimer_inverter_dc_power', {
                headers: { Authorization: token }
            });
            setSolarProduction(
                solarProductionResponse.data.state && solarProductionResponse.data.state !== 'unavailable'
                    ? solarProductionResponse.data.state
                    : 'Data not available at the moment'
            );

            // Chiamata API per la temperatura in tempo reale
            const temperatureResponse = await axios.get('https://gdfhome.duckdns.org/api/states/sensor.termostat_temperature', {
                headers: { Authorization: token }
            });
            setTemperature(
                temperatureResponse.data.state && temperatureResponse.data.state !== 'unavailable'
                    ? temperatureResponse.data.state
                    : 'Data not available at the moment'
            );


            setIsLoading(false);


        } catch (error) {
            setIsLoading(false);
            console.error('Errore durante il fetch dei dati', error);
            setSolarProduction('Data not available at the moment');
            setTemperature('Data not available at the moment');
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 300000);
        return () => clearInterval(intervalId);
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#66B2FF', '#FF6699', '#6B8E23', '#FFD700', '#8A2BE2', '#FF4500']; // Colori per le sezioni della torta

    // Filtro dei dati orari in base alla data selezionata
    const filterDataByDate = (data, date) => {
        return data.filter(item => item.date && item.date.startsWith(date));
    };

    const filteredData = selectedDate
        ? selectedHour
            ? selectedMinute
                ? data.minutelyPrediction.filter(item => item.date.startsWith(`${selectedDate} ${selectedHour}:${selectedMinute}`))
                : data.minutelyPrediction.filter(item => item.date.startsWith(`${selectedDate} ${selectedHour}`))
            : data.hourlyPrediction.filter(item => item.date.startsWith(selectedDate))
        : data.dailyPrediction;

    const maxState = Math.max(...filteredData.map(item => parseFloat(item.state || 0)));

    const generatePieData = () => {
        if (selectedHour) {
            return filteredData.map(item => {
                // Estrai solo ore e minuti dalla stringa di data
                const timePart = item.date.split(' ')[1];
                const [hoursAndMinutes] = timePart.split(':');
                return {
                    name: `${hoursAndMinutes}:${timePart.split(':')[1]}`,
                    value: parseFloat(item.state),
                    production: item.state
                };
            });
        } else if (selectedDate) {
            return filteredData.map(item => {
                // Estrai solo l'ora
                const timePart = item.date.split(' ')[1];
                const [hour] = timePart.split(':');
                return {
                    name: `${hour}:00`,
                    value: parseFloat(item.state),
                    production: item.state
                };
            });
        } else {
            return filteredData.map(item => ({
                name: item.date.split(' ')[0],
                value: parseFloat(item.state),
                production: item.state
            }));
        }
    };


    const pieData = generatePieData();

    const formatPieLabel = (dateStr, level) => {
        if (!dateStr || typeof dateStr !== 'string') {
            return 'No data';
        }

        // Prova a separare data e ora solo se la stringa contiene uno spazio
        const [datePart, timePart] = dateStr.includes(' ') ? dateStr.split(' ') : [dateStr, null];

        if (level === 'minute' && timePart) {
            return `${timePart}`;
        } else if (level === 'hour' && timePart) {
            const [hour] = timePart.split(':');
            return `${hour}:00`;
        } else if (level === 'day') {
            return datePart;
        } else {
            return datePart;
        }
    };

    const getColorForDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') {
            console.log('Invalid dateStr detected 1, returning COLORS[0]');
          return COLORS[0];
        }
      
        const [datePart, timePart] = dateStr.split(' ');
        if (!datePart || !timePart) {
            console.log('Invalid dateStr detected 2 , returning COLORS[0]');
          return COLORS[0];
        }
      
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
      
        if (
          !year || !month || !day ||
          !hour || !minute || !second
        ) {
            console.log('Invalid dateStr detected 3, returning COLORS[0]');
          return COLORS[0];
        }
      
        // Calcola l'indice hash combinando data e orario
        const hash = (
          parseInt(year) +
          parseInt(month) +
          parseInt(day) +
          parseInt(hour) +
          parseInt(minute) +
          parseInt(second)
        ) % COLORS.length;
      
        return COLORS[hash];
      };


    // Funzione per mostrare la percentuale e la data come etichetta
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 20;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
    

        const dataPoint = pieData[index] || {};
        let { name, production } = dataPoint;
    
        name = name.includes(':') ? name : `${name} 00:00:00`;
    
        const level = selectedMinute ? 'minute' : selectedHour ? 'hour' : 'day';
        const formattedName = formatPieLabel(name, level);
        const displayLabel = `${formattedName}: ${(percent * 100).toFixed(0)}%`;
    
        const lineStartX = cx + (outerRadius * 0.8) * Math.cos(-midAngle * RADIAN);
        const lineStartY = cy + (outerRadius * 0.8) * Math.sin(-midAngle * RADIAN);
    
        const color = 'black';
    
        return (
            <g>
                <line
                    x1={lineStartX}
                    y1={lineStartY}
                    x2={x}
                    y2={y}
                    stroke={color}
                    strokeWidth={1}
                />
                <text
                    x={x}
                    y={y}
                    fill={color}
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize="12px"
                >
                    {displayLabel}
                </text>
            </g>
        );
    };
    

    // Funzione per gestire il clic su un box data
    const handleDateClick = (date) => {
        setSelectedDate(date);
        setSelectedHour(null); // Resetta l'ora selezionata
        setSelectedMinute(null); // Resetta il minuto selezionato
    };

    // Funzione per gestire il clic su un box ora
    const handleHourClick = (hour) => {
        setSelectedHour(hour);
        setSelectedMinute(null); // Resetta il minuto selezionato
    };

    // Funzione per tornare indietro (dai minuti alle ore, e dalle ore ai giorni)
    const handleBackClick = () => {
        if (selectedHour) {
            setSelectedHour(null);
        } else if (selectedDate) {
            setSelectedDate(null);
        }
    };

    // Funzione per ottenere solo l'orario dalla data
    const getHourFromDate = (dateStr) => {
        if (dateStr) {
            const parts = dateStr.split(' ');
            return parts.length > 1 ? parts[1].split(':')[0] : '';
        }
        return '';
    };

    // Funzione per formattare la data per i riquadri
    const formatDate = (dateStr) => {
        const [datePart, timePart] = dateStr.split(' ');
        if (selectedHour) {
            const [hour, minute] = timePart.split(':');
            return `${hour}:${minute}`;
        } else if (selectedDate) {
            const [hour] = timePart.split(':');
            return `${hour}:00`;
        }
        return datePart;
    };


    const colorText = solarProduction > 500
    ? 'white'
    : 'black';

    const cardStyle = solarProduction == 'Data not available at the moment'
  ? { backgroundColor: 'white' }  // Sfondo bianco se solarProduction è nullo
  : {
      backgroundImage: `url(${
        solarProduction > 999
          ? "/soleggiato.png"
          : solarProduction > 150
          ? "/poconuvoloso.png"
          : "/nuvoloso.png"
      })`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      padding: '20px',
      borderRadius: '10px',
      color: colorText,
      textAlign: 'center',
      width: '45%',
    };

    const colorText_temp = temperature > 18
    ? 'white'
    : 'black';

    const cardStyle_temp = temperature == 'Data not available at the moment' 
    ? {backgroundColor: 'white' }
    : {
        backgroundImage: `url(${
            temperature > 18
             ? "/caldo.png"
             : "/freddo.png"
        })`,
        backgroundRepeat: 'no-repeat',  
        backgroundSize: 'cover', 
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        color: colorText_temp,
        width: '45%',
      };



    return (
        <div className="dashboard">

            {isLoading && (
                <div className="loading-overlay">
                    <img src="/sun.gif" alt="Caricamento..." className="loading-gif" />
                </div>
            )}

            <h1>Real Time Data
                <span id="real-time-info" className="info-icon">?</span>
                <Tooltip anchorId="real-time-info"
                         content="The reported values indicate solar production and current temperature, respectively."
                         style={{fontSize: '18px'}}
                />
            </h1>
            <div className="real-time-blocks">
                <div style={cardStyle} className="real-time-card">
                    <h2>Real-Time Solar Production</h2>
                    <div style={{fontSize: '30px', fontWeight: 'bold'}}>
                        {solarProduction === null 
                            ? '-' 
                            : isNaN(solarProduction) 
                            ? solarProduction 
                            : `${solarProduction} (W)`}
                    </div>
                </div>
                <div style={cardStyle_temp} className="real-time-card">
                    <h2>Real-Time Temperature</h2>
                    <div style={{fontSize: '30px', fontWeight: 'bold'}}>
                        {temperature === null 
                            ? '-' 
                            : isNaN(temperature) 
                            ? temperature 
                            : `${temperature} (°C)`}
                    </div>
                </div>
            </div>
            <h1>Solar Production Forecast
                <span id="card-prod-info" className="info-icon">?</span>
                <Tooltip anchorId="card-prod-info" content=
                    {selectedHour
                        ? "Values expressed in watts (Wh) represent instantaneous solar production at the specified time."
                        : selectedDate
                            ? "Values expressed in watts (Wh) represent the total solar output produced during the time interval from the specified hour to the next."
                            : "Values expressed in watts (Wh) represent the total solar production for each day."
                    }
                         style={{ fontSize: '20px' }}
                />
            </h1>

            <div className="grid-container">

            {(selectedDate || selectedHour) && (
                        <div className="info-message">
                        {selectedDate ? selectedDate.split(' ')[0] : ''}
                    </div>
                    )}
                <div className="daily-predictions">
                    {(selectedMinute || selectedHour || selectedDate) && (
                        <div className="prediction-card"
                             onClick={handleBackClick}
                             style={{backgroundColor: 'white'}}>
                            <div className="back">
                                {selectedHour ? "Back to all hours" : "Back to all dates"}
                            </div>
                        </div>
                    )}
                    {filteredData.map((item, index) => (
                        <div
                            className="prediction-card"
                            key={index}
                            style={{backgroundColor: getColorForDate(item.date)}}
                            onClick={() => selectedDate ? (selectedHour ? null : handleHourClick(getHourFromDate(item.date))) : handleDateClick(item.date.split(' ')[0])}
                        >
                            <div className="time">{formatDate(item.date)}</div>
                            <div className="state">{parseFloat(item.state).toFixed(3)}</div>
                        </div>
                    ))}
                </div>

                <div  className={`chart-container ${!selectedDate && !selectedHour ? 'date-view' : ''}`}>
                    <div  className="chart chart-solar-production">
                        <h3>
                            Solar production trend
                            <span id="state-trend-info" className="info-icon">?</span>
                            <Tooltip anchorId="state-trend-info"
                                     content="This graph shows the development of solar production values."/>
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart
                                data={filteredData}
                                margin={{top: 20, right: 30, left: 20, bottom: 5}}
                            >
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="date"
                                tickFormatter={(value) => {
                                    if (!selectedDate && !selectedHour) {
                                        return format(new Date(value), 'yyyy-MM-dd');
                                    } else if (selectedDate && !selectedHour) {
                                        return format(new Date(value), 'HH:00');
                                    } else if (selectedDate && selectedHour) {
                                        return format(new Date(value), 'HH:mm');
                                    }
                                    return value;
                                }}/>
                                <YAxis
                                    domain={[0, maxState]}
                                    tickFormatter={(value) => value.toFixed(2)} 
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`Predicted Solar Production: ${value}`]}
                                />
            

                                <Legend 
                                    formatter={(value) => "Predicted Solar Production"}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="state"
                                    stroke="#8884d8"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {selectedDate === null && (
                        <div className="chart chart-temperature-trend">
                            <h3>
                                Temperature trend
                                <span id="temp-trend-info" className="info-icon">?</span>
                                <Tooltip anchorId="temp-trend-info"
                                         content="This graph shows the maximum and minimum air temperatures at 2 metres above ground for the next few days."/>
                            </h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={filteredData}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="date"
                                    tickFormatter={(value) => format(new Date(value), 'yyyy-MM-dd')}/>
                                    <YAxis/>
                                    <RechartsTooltip/>
                                    <Legend />
                                        <Bar 
                                            dataKey="temperature_2m_max" 
                                            fill="#FF0000"
                                            name="Maximum temperature at 2 m"
                                        />
                                        <Bar 
                                            dataKey="temperature_2m_min" 
                                            fill="#0000FF"
                                            name="Minimum temperature at 2 m"
                                        />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="chart chart-solar-share">
                        <h3>
                            Solar production share
                            <span id="weekly-prod-info" className="info-icon">?</span>
                            <Tooltip anchorId="weekly-prod-info" content=
                                {selectedHour
                                    ? "This graph shows the percentage by which each minute contributes to the expected solar output for the entire hour."
                                    : selectedDate
                                        ? "This graph shows the percentage by which each hour contributes to the expected solar output for the whole day."
                                        : "This graph shows the percentage by which each day contributes to the expected solar output for the next six days."
                                }/>
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    data={filteredData.map(item => {
                                        let name = item.date.includes(':') ? item.date : `${item.date} 00:00:00`; // Aggiungi l'ora se mancante
                                        return {
                                            name,
                                            value: parseFloat(item.state),
                                            production: item.state
                                        };
                                    })}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={150}
                                    fill="#8884d8"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {filteredData.map((item, index) => (
                                        <Cell key={index} fill={getColorForDate(item.date)}/>
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value, name, props) => {
                                        const {production} = props.payload || {};
                                        return [`${production || 'No data'} W`, 'Predicted Solar Production'];
                                    }}

                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="verification-container">
                <h1>Performance Review
                    <span id="verification-info" className="info-icon">?</span>
                    <Tooltip anchorId="verification-info"
                            content="This table shows the comparison between planned and actual solar production for the past 7 days. Only available data is displayed."/>
                </h1>                       
                <div className="verification-table-container">
                    {verificationData.length > 0 ? (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Planned Production (Wh)</th>
                                    <th>Effective Production (Wh)</th>
                                    <th>Accuracy (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {verificationData.map((item, index) => {
                                    const planned = parseFloat(item.planned_state);
                                    const effective = item.effective_state === 'unavailable' ? null : parseFloat(item.effective_state);
                                    const accuracy = effective ? 
                                        (100 - Math.abs((effective - planned) / planned * 100)).toFixed(2) : 
                                        'N/A';
                                    
                                    return (
                                        <tr key={index}>
                                            <td>{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                            <td>{planned.toFixed(2)}</td>
                                            <td>
                                                {effective !== null ? 
                                                    effective.toFixed(2) : 
                                                    'Not available'}
                                            </td>
                                            <td>
                                                {accuracy !== 'N/A' ? 
                                                    `${accuracy}%` : 
                                                    'N/A'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{fontSize: '20px', fontWeight: 'bold', padding: '20px'}}>
                            No verification data available for the past 7 days.
                        </div>
                    )}
                </div>
                {verificationData.length > 0 && (
                    <div className="chart chart-verification-trend">
                        <h3>
                            Planned vs Effective Production
                            <span id="verification-trend-info" className="info-icon">?</span>
                            <Tooltip
                                anchorId="verification-trend-info"
                                content="This graph shows the variation of planned and effective solar production over the past 7 days. Only available data is displayed."
                            />
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={verificationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) =>
                                        format(new Date(value), "yyyy-MM-dd")
                                    }
                                />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="planned_state"
                                    stroke="#8884d8"
                                    name="Planned Production"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="effective_state"
                                    stroke="#82ca9d"
                                    name="Effective Production"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
                </div>
                


                <h1>Model Evaluation</h1>
                <div className="evaluation-container">
                    <p className="evaluation-text">
                        For more information on the predictive model used{' '}
                        <span
                            onClick={handleEvaluate}
                            className="evaluation-link"
                        >
                            click here
                        </span>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;