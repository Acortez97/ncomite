// src/components/Layout.js
import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div style={styles.wrapper}>
      {/* Head / meta info */}
      <Helmet>
        <title>COMITE DEL AGUA</title>
        <meta name="description" content="Administración del sistema de agua." />
        <link rel="icon" href="/logoagua.ico" />
      </Helmet>

      <Navbar />

      <main className="container" style={styles.main}>
        {children}
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
  },
};
