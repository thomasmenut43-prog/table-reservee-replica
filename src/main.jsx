import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';

// Error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#fee', color: '#c00' }}>
          <h1>Erreur JavaScript détectée :</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.toString()}
          </pre>
          <h2>Stack trace:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px' }}>
            {this.state.error?.stack}
          </pre>
          <h2>Component Stack:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dynamic import of App with error handling
async function loadApp() {
  try {
    console.log('Loading App...');
    const { default: App } = await import('@/App.jsx');
    console.log('App loaded successfully');

    ReactDOM.createRoot(document.getElementById('root')).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Failed to load App:', error);
    document.getElementById('root').innerHTML = `
      <div style="padding: 20px; font-family: monospace; background: #fee; color: #c00;">
        <h1>Erreur de chargement:</h1>
        <pre>${error.toString()}</pre>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}

loadApp();
