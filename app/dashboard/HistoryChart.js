"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// ApexCharts needs to be imported dynamically for Next.js (client-side only)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function HistoryChart({ data, style }) {
  if (!data || !data.seriesData) return <div style={{color:'#666'}}>No Data</div>;

  // CHART CONFIGURATION
  const options = {
    chart: {
      type: style === '1' ? 'candlestick' : 'area', // '1' = Candle, '2' = Line (Area looks better)
      background: 'transparent',
      toolbar: { show: false }, // Hide zoom tools for cleaner look
      animations: { enabled: false } // Instant load
    },
    theme: { mode: 'dark' },
    stroke: { width: 2, curve: 'smooth' },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#888' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: '#888' } },
      tooltip: { enabled: true }
    },
    grid: {
      borderColor: '#333',
      strokeDashArray: 3
    },
    // COLORS: Green for Bullish, Red for Bearish
    colors: [data.isBullish ? '#00E396' : '#FF4560'],
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#00E396',
          downward: '#FF4560'
        }
      }
    }
  };

  const series = [{
    name: 'Price',
    data: data.seriesData // Contains the real [time, open, high, low, close]
  }];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Chart 
        options={options} 
        series={series} 
        type={style === '1' ? 'candlestick' : 'area'} 
        width="100%" 
        height="100%" 
      />
    </div>
  );
}