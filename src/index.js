import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

/*
// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

export default function Home() {
  const navigate = useNavigate(); // reemplazo de useRouter
  const [salidas, setSalidas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [avol, setAvol] = useState([]);

  // Verificar usuario
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login'); // redirige a login
    }
  }, [navigate]);

  // Obtener datos de la API
  useEffect(() => {
    fetch('/api/select_gen.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        select: `SUM(monto) AS total_salidas`,
        table: `salidas`,
      }),
    })
      .then(res => res.json())
      .then(data => { if (!data.error) setSalidas(data); });

    fetch('/api/select_gen.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        select: `SUM(monto_pago) AS total_pagos`,
        table: `pagos`,
      }),
    })
      .then(res => res.json())
      .then(data => { if (!data.error) setPagos(data); });

    fetch('/api/select_gen.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        select: `SUM(monto) AS total_avol`,
        table: `aportacion_voluntaria`,
      }),
    })
      .then(res => res.json())
      .then(data => { if (!data.error) setAvol(data); })
      .catch(err => console.error('Error al obtener aportaciones:', err));
  }, []);

  const totalSalidas = Number(salidas[0]?.total_salidas || 0);
  const totalPagos = Number(pagos[0]?.total_pagos || 0);
  const totalAvol = Number(avol[0]?.total_avol || 0);
  const totalSobrante = totalPagos + totalAvol - totalSalidas;

  const data = {
    labels: ['Pagos Anualidad', 'Aportaciones Voluntarias', 'Gastos (Salidas)', 'Sobrante'],
    datasets: [
      {
        label: 'Totales en pesos (MXN)',
        data: [totalPagos, totalAvol, totalSalidas, totalSobrante],
        backgroundColor: [
          'rgba(0, 150, 136, 0.7)',
          'rgba(33, 150, 243, 0.7)',
          'rgba(244, 67, 54, 0.7)',
          'rgba(76, 175, 80, 0.7)',
        ],
        borderColor: [
          'rgba(0, 150, 136, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(76, 175, 80, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Resumen Financiero del Comité de Agua',
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#000',
        font: { weight: 'bold' },
        formatter: (value) => `$${value.toLocaleString('es-MX')}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value.toLocaleString('es-MX')}`,
        },
      },
    },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '1px',
        backgroundColor: '#e0f7fa',
        color: '#00796b',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '3.1rem',
          fontWeight: '700',
          marginBottom: '50px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        Bienvenido al Portal de Administración del Comité de Agua
      </h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '50px',
          flexWrap: 'wrap',
          width: '90%',
        }}
      >
        <img
          src="/logoagua.ico"
          alt="Icono Comité del Agua"
          style={{
            width: '220px',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 121, 107, 0.4)',
          }}
        />
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
*/