"use client";
import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  
  // Current Active Video
  const [currentReport, setCurrentReport] = useState(null);
  
  // History List
  const [history, setHistory] = useState([]);

  // 1. Load History on Page Start
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const res = await fetch('/api/agent');
    const data = await res.json();
    if (data.success) {
      setHistory(data.history);
      // If we have history, show the latest one immediately
      if (data.history.length > 0) setCurrentReport(data.history[0]);
    }
  }

  // 2. Generate New Report
  async function handleGenerate() {
    setLoading(true);
    try {
      const response = await fetch('/api/agent', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setCurrentReport(data.data);
        fetchHistory(); // Refresh the list
      }
    } catch (err) {
      alert("Error generating report");
    } finally {
      setLoading(false);
    }
  }

  // Helper to load an old report when clicked
  function loadOldReport(report) {
    setCurrentReport(report);
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>⚡ ChartSense Admin</h1>
      
      <div style={styles.grid}>
        {/* LEFT COLUMN: Main Player */}
        <div style={styles.mainColumn}>
          <div style={styles.videoBox}>
            {loading && <div style={styles.loadingOverlay}>⚙️ GENERATING NEW REPORT...</div>}
            
            {currentReport ? (
              <>
                <div style={styles.overlay}>🔴 {currentReport.date}</div>
                <img src={currentReport.image} alt="Chart" style={styles.chartImage} />
                <div style={styles.newsTicker}>
                  <h3 style={styles.tickerTitle}>{currentReport.headline}</h3>
                  <p style={styles.tickerText}>{currentReport.script}</p>
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>No reports generated yet. Click Generate!</div>
            )}
          </div>

          <div style={styles.controls}>
             <button 
              onClick={handleGenerate} 
              disabled={loading}
              style={{...styles.button, opacity: loading ? 0.5 : 1}}
            >
              {loading ? "Generating..." : "Generate New Market Report"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: History List */}
        <div style={styles.historyColumn}>
          <h2>📜 Previous Scans</h2>
          <div style={styles.list}>
            {history.map((item) => (
              <div 
                key={item.id} 
                style={styles.historyItem}
                onClick={() => loadOldReport(item)}
              >
                <div style={styles.miniThumbnail}>
                  <img src={item.image} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </div>
                <div>
                  <div style={styles.historyDate}>{item.date}</div>
                  <div style={styles.historyTitle}>{item.headline.substring(0, 30)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '40px', backgroundColor: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  header: { borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px', color: '#00ff00' },
  grid: { display: 'flex', gap: '40px' },
  mainColumn: { flex: 2 },
  historyColumn: { flex: 1, backgroundColor: '#222', padding: '20px', borderRadius: '10px', height: 'fit-content' },
  videoBox: { aspectRatio: '16/9', backgroundColor: '#000', position: 'relative', border: '2px solid #333', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', color: '#00ff00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', zIndex: 10 },
  overlay: { position: 'absolute', top: '10px', left: '10px', backgroundColor: 'red', color: 'white', padding: '5px 10px', fontWeight: 'bold', fontSize: '12px', borderRadius: '4px' },
  chartImage: { width: '100%', height: '100%', objectFit: 'cover' },
  newsTicker: { position: 'absolute', bottom: '0', left: '0', right: '0', backgroundColor: 'rgba(0,0,0,0.85)', padding: '15px', borderTop: '2px solid #00ff00' },
  tickerTitle: { margin: '0 0 5px 0', color: '#00ff00', textTransform: 'uppercase' },
  tickerText: { margin: 0, fontSize: '14px', lineHeight: '1.4' },
  emptyState: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' },
  controls: { padding: '20px', backgroundColor: '#222', borderRadius: '10px' },
  button: { display: 'block', width: '100%', padding: '15px', backgroundColor: '#00ff00', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', fontSize: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' },
  historyItem: { display: 'flex', gap: '10px', padding: '10px', backgroundColor: '#333', borderRadius: '5px', cursor: 'pointer', transition: '0.2s' },
  miniThumbnail: { width: '60px', height: '60px', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden' },
  historyDate: { fontSize: '12px', color: '#888', marginBottom: '4px' },
  historyTitle: { fontSize: '14px', fontWeight: 'bold', color: '#fff' }
};