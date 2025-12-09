"use client";
import React, { useState, useEffect } from 'react';
import TradingViewWidget from './TradingViewWidget';
import HistoryChart from './HistoryChart';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeRange, setTimeRange] = useState('daily');
  const [isLive, setIsLive] = useState(true);
  const [chartStyle, setChartStyle] = useState('1'); 

  useEffect(() => {
    const saved = localStorage.getItem('chartSenseHistory');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setIsLive(true);
    window.speechSynthesis.cancel();
    
    try {
      const response = await fetch('/api/agent', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange: timeRange }) 
      });
      const data = await response.json();
      if (data.success) {
        const newReport = data.data;
        setCurrentReport(newReport);
        const updated = [newReport, ...history];
        setHistory(updated);
        localStorage.setItem('chartSenseHistory', JSON.stringify(updated));
        speakText(newReport.script);
      }
    } catch (err) { alert("Error"); } 
    finally { setLoading(false); }
  }

  function clearHistory() {
    if(confirm("Delete History?")) {
      setHistory([]);
      localStorage.removeItem('chartSenseHistory');
    }
  }

  function handleHistoryClick(item) {
    setCurrentReport(item);
    setIsLive(false);
    window.speechSynthesis.cancel();
  }

  function speakText(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
    utterance.voice = preferredVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function toggleSpeech() {
    if(isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
    else if(currentReport) speakText(currentReport.script);
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h1 style={styles.header}>⚡ ChartSense Live</h1>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
           <button onClick={clearHistory} style={styles.clearBtn}>🗑️ Clear</button>
           <div style={styles.badge}>🟢 System Online</div>
        </div>
      </div>
      
      <div style={styles.grid}>
        <div style={styles.mainColumn}>
          
          <div style={styles.controlBar}>
             <div style={styles.controlGroup}>
              <span style={styles.selectorLabel}>Report:</span>
              <div style={styles.toggleGroup}>
                <button style={timeRange === 'daily' ? styles.activeBtn : styles.inactiveBtn} onClick={() => setTimeRange('daily')}>Daily</button>
                <button style={timeRange === 'weekly' ? styles.activeBtn : styles.inactiveBtn} onClick={() => setTimeRange('weekly')}>Weekly</button>
              </div>
            </div>
            <div style={styles.controlGroup}>
              <span style={styles.selectorLabel}>Chart:</span>
              <div style={styles.toggleGroup}>
                <button style={chartStyle === '1' ? styles.activeBtn : styles.inactiveBtn} onClick={() => setChartStyle('1')}>🕯️ Candles</button>
                <button style={chartStyle === '2' ? styles.activeBtn : styles.inactiveBtn} onClick={() => setChartStyle('2')}>📈 Line</button>
              </div>
            </div>
          </div>

          <div style={styles.videoBox}>
            {loading && <div style={styles.loadingOverlay}>⚙️ ANALYZING MARKETS...</div>}
            
            {isLive ? (
               <div style={{height: '100%', width: '100%'}}>
                 <TradingViewWidget interval={timeRange === 'weekly' ? "W" : "D"} style={chartStyle} />
                 {currentReport && <Ticker report={currentReport} />}
               </div>
            ) : (
              // HISTORY MODE
              currentReport && (
                <>
                  <div style={styles.liveTag}>📜 ARCHIVED REPORT</div>
                  
                  {/* The New High-Res History Chart */}
                  <div style={styles.chartContainer}>
                    <HistoryChart 
                      data={currentReport.chartData} 
                      style={chartStyle} 
                    />
                  </div>

                  <Ticker report={currentReport} />
                </>
              )
            )}

            {!currentReport && !loading && isLive && (
               <div style={styles.emptyState}>
                 <TradingViewWidget interval="D" style={chartStyle} />
                 <div style={styles.startOverlay}>Click Generate to Start Analysis</div>
               </div>
            )}
          </div>

          <div style={styles.controls}>
             <button onClick={handleGenerate} disabled={loading} style={{...styles.button, opacity: loading ? 0.5 : 1}}>
              {loading ? "Scanning..." : `Generate ${timeRange === 'daily' ? 'Daily' : 'Weekly'} Report`}
            </button>
            {currentReport && (
              <button onClick={toggleSpeech} style={styles.secondaryBtn}>{isSpeaking ? "Stop" : "Read Aloud"}</button>
            )}
          </div>
        </div>

        <div style={styles.historyColumn}>
          <h2>📜 Recent Scans</h2>
          <div style={styles.list}>
            {history.map((item) => (
              <div key={item.id} style={styles.historyItem} onClick={() => handleHistoryClick(item)}>
                {/* Tiny Trend Preview */}
                <div style={{
                  ...styles.miniThumbnail, 
                  backgroundColor: item.chartData?.isBullish ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888'
                }}>
                   {item.chartData?.isBullish ? '📈 UP' : '📉 DOWN'}
                </div>
                <div>
                  <div style={styles.historyDate}>{item.date}</div>
                  <div style={styles.historyTitle}>{item.headline.substring(0, 25)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Ticker({ report }) {
  return (
    <div style={styles.newsTicker}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px'}}>
        <h3 style={styles.tickerTitle}>{report.headline}</h3>
        {report.probability && (
          <div style={{
            backgroundColor: report.sentiment === 'BULLISH' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
            border: `1px solid ${report.sentiment === 'BULLISH' ? '#00ff00' : '#ff0000'}`,
            padding: '4px 12px', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '14px'
          }}>
            🎯 {report.probability}%
          </div>
        )}
      </div>
      {report.probability && (
        <div style={{width: '100%', height: '4px', backgroundColor: '#333', marginBottom: '12px', borderRadius: '2px'}}>
          <div style={{
            width: `${report.probability}%`,
            height: '100%',
            backgroundColor: report.sentiment === 'BULLISH' ? '#00ff00' : '#ff0000',
            borderRadius: '2px',
          }}></div>
        </div>
      )}
      <p style={styles.tickerText}>{report.script}</p>
    </div>
  );
}

const styles = {
  container: { padding: '30px', backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' },
  header: { margin: 0, color: '#00ff00', fontSize: '24px' },
  badge: { backgroundColor: '#111', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid #333', color: '#00ff00' },
  clearBtn: { background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:'12px', marginRight:'10px' },
  grid: { display: 'flex', gap: '30px' },
  mainColumn: { flex: 2 },
  historyColumn: { flex: 1, backgroundColor: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #222' },
  controlBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  controlGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  selectorLabel: { color: '#888', fontSize: '14px', fontWeight: 'bold' },
  toggleGroup: { display: 'flex', gap: '5px', backgroundColor: '#111', padding: '4px', borderRadius: '25px', border: '1px solid #333' },
  activeBtn: { padding: '6px 16px', backgroundColor: '#00ff00', color: '#000', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  inactiveBtn: { padding: '6px 16px', backgroundColor: 'transparent', color: '#888', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  videoBox: { height: '500px', backgroundColor: '#050505', position: 'relative', border: '1px solid #333', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', color: '#00ff00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', zIndex: 10 },
  liveTag: { position: 'absolute', top: '20px', left: '20px', backgroundColor: '#ff0000', color: 'white', padding: '4px 12px', fontWeight: 'bold', fontSize: '12px', borderRadius: '4px', zIndex: 5 },
  chartContainer: { width: '100%', height: '100%', padding: '10px 10px 120px 10px', backgroundColor: '#000' }, // Added padding bottom to avoid overlap with ticker
  newsTicker: { position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(to top, #000 95%, transparent)', padding: '30px', borderTop: '1px solid #333', zIndex: 6 },
  tickerTitle: { margin: '0 0 8px 0', color: '#00ff00', textTransform: 'uppercase', fontSize: '20px' },
  tickerText: { margin: 0, fontSize: '16px', lineHeight: '1.5', color: '#ddd' },
  emptyState: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' },
  startOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.7)', padding: '20px', borderRadius: '10px', color: '#fff', zIndex: 2 },
  controls: { display: 'flex', gap: '15px' },
  button: { flex: 2, padding: '18px', backgroundColor: '#00ff00', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textTransform: 'uppercase' },
  secondaryBtn: { flex: 1, padding: '18px', backgroundColor: '#222', color: '#fff', border: '1px solid #333', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', fontSize: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' },
  historyItem: { display: 'flex', gap: '15px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '8px', cursor: 'pointer', border: '1px solid #333' },
  miniThumbnail: { width: '70px', height: '50px', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden' },
  historyDate: { fontSize: '11px', color: '#666', marginBottom: '4px' },
  historyTitle: { fontSize: '13px', fontWeight: 'bold', color: '#eee' }
};