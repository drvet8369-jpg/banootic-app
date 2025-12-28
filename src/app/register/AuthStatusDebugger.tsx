'use client';
import { useAuth } from '@/components/providers/auth-provider';

export function AuthStatusDebugger() {
  const { session, user, loading } = useAuth();

  const statusBoxStyle: React.CSSProperties = {
    border: '2px solid red',
    padding: '16px',
    margin: '16px 0',
    backgroundColor: '#fff0f0',
    color: 'black',
    borderRadius: '8px',
    direction: 'ltr',
    textAlign: 'left',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    position: 'fixed',
    top: '80px',
    left: '20px',
    right: '20px',
    zIndex: 9999,
  };

  return (
    <div style={statusBoxStyle}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>Auth Status Debugger</h3>
      <p><strong>Loading State:</strong> {loading ? '⏳ In Progress...' : '✅ Complete'}</p>
      <p><strong>Session State:</strong> {session ? `✅ Exists (User ID: ${session.user.id.substring(0, 8)}...)` : '❌ NULL'}</p>
      <p><strong>Profile (User) State:</strong> {user ? `✅ Exists (Name: ${user.full_name})` : '❌ NULL'}</p>
    </div>
  );
}
