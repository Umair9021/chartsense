"use client";
import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ interval, style }) { // Now accepts 'style'
  const container = useRef();

  useEffect(() => {
    if (container.current) {
      container.current.innerHTML = ""; 
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "OANDA:XAUUSD",
        "interval": "${interval}", 
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "${style}",  
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(0, 0, 0, 1)",
        "gridColor": "rgba(66, 66, 66, 0.06)",
        "hide_top_toolbar": true,
        "hide_legend": true,
        "save_image": false,
        "calendar": false,
        "hide_volume": true,
        "support_host": "https://www.tradingview.com"
      }`;
    container.current.appendChild(script);
  }, [interval, style]); // Re-run when interval OR style changes

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewWidget);