"use client";
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* 1. NAVBAR */}
      <nav style={styles.nav}>
        <div style={styles.logo}>⚡ ChartSense</div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.link}>Features</a>
          <a href="#pricing" style={styles.link}>Pricing</a>
          <Link href="/dashboard">
            <button style={styles.loginBtn}>Launch App</button>
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>NEW: AI V2.0 RELEASED</div>
          <h1 style={styles.title}>
            Automate Your <span style={{color: '#00ff00'}}>Forex Analysis</span>
          </h1>
          <p style={styles.subtitle}>
            Stop staring at charts all day. Our Autonomous AI Agent scrapes news, 
            analyzes technical patterns, and generates video reports while you sleep.
          </p>
          <div style={styles.ctaGroup}>
            <Link href="/dashboard">
              <button style={styles.primaryBtn}>Get Started Free</button>
            </Link>
            <button style={styles.secondaryBtn}>Watch Demo</button>
          </div>
          <p style={styles.microText}>*No credit card required • Used by 500+ Traders</p>
        </div>
        
        {/* Visual Graphic */}
        <div style={styles.heroImage}>
          <div style={styles.floatingCard}>
            <span>📈 Gold (XAUUSD)</span>
            <span style={{color: '#00ff00'}}>+1.2% 🚀</span>
          </div>
          <img src="/chart-gold.png" alt="App Dashboard" style={styles.screenshot} />
        </div>
      </header>

      {/* 3. FEATURES GRID */}
      <section id="features" style={styles.features}>
        <h2 style={styles.sectionTitle}>Why Traders Choose ChartSense?</h2>
        <div style={styles.grid}>
          <FeatureCard 
            icon="🤖" 
            title="Autonomous AI Agent" 
            desc="Runs 24/7 on our cloud servers. Never miss a London or NY session move." 
          />
          <FeatureCard 
            icon="📊" 
            title="Instant Chart Capture" 
            desc="Integrates with TradingView to snap high-res technical charts automatically." 
          />
          <FeatureCard 
            icon="⚡" 
            title="Real-Time News" 
            desc="Scrapes ForexFactory & Bloomberg faster than humanly possible." 
          />
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer style={styles.footer}>
        <p>© 2025 ChartSense Inc. Final Year Project.</p>
      </footer>
    </div>
  );
}

// Sub-Component for Features
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.icon}>{icon}</div>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{desc}</p>
    </div>
  );
}

// STYLES
import { CSSProperties } from 'react';

const styles: { [key: string]: CSSProperties } = {
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #222' },
  logo: { fontSize: '24px', fontWeight: 'bold', color: '#fff' },
  navLinks: { display: 'flex', gap: '30px', alignItems: 'center' },
  link: { color: '#888', textDecoration: 'none', fontSize: '14px' },
  loginBtn: { padding: '10px 20px', backgroundColor: '#222', color: '#fff', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' },
  
  hero: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 20px' },
  heroContent: { maxWidth: '800px', marginBottom: '60px' },
  badge: { backgroundColor: 'rgba(0, 255, 0, 0.1)', color: '#00ff00', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '20px' },
  title: { fontSize: '60px', fontWeight: '800', lineHeight: '1.1', marginBottom: '20px' },
  subtitle: { fontSize: '18px', color: '#888', marginBottom: '40px', lineHeight: '1.6' },
  ctaGroup: { display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' },
  primaryBtn: { padding: '15px 40px', backgroundColor: '#00ff00', color: '#000', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  secondaryBtn: { padding: '15px 40px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #333', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  microText: { fontSize: '12px', color: '#444' },

  heroImage: { position: 'relative', maxWidth: '900px', width: '100%', border: '1px solid #333', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 0 50px rgba(0, 255, 0, 0.1)' },
  screenshot: { width: '100%', display: 'block' },
  floatingCard: { position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '10px', backdropFilter: 'blur(10px)', border: '1px solid #333', display: 'flex', gap: '15px', fontWeight: 'bold' },

  features: { padding: '80px 40px', backgroundColor: '#0a0a0a' },
  sectionTitle: { textAlign: 'center', fontSize: '30px', marginBottom: '60px' },
  grid: { display: 'flex', gap: '30px', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' },
  card: { backgroundColor: '#111', padding: '30px', borderRadius: '15px', width: '300px', border: '1px solid #222' },
  icon: { fontSize: '40px', marginBottom: '20px' },
  cardTitle: { fontSize: '20px', marginBottom: '10px' },
  cardDesc: { color: '#888', lineHeight: '1.5' },

  footer: { padding: '40px', textAlign: 'center', borderTop: '1px solid #222', color: '#444' }
};