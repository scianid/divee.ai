import { useNavigate } from 'react-router-dom';

interface CreateWidgetModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWidgetModal({ open, onClose }: CreateWidgetModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleCreateWidget = () => {
    navigate('/inventory');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
          borderRadius: 24,
          boxShadow: '0 40px 90px rgba(79, 70, 229, 0.4)',
          maxWidth: '500px',
          width: '100%',
          padding: '48px 40px',
          textAlign: 'center',
          color: '#ffffff'
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
          Create Your First Widget
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 32px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
          You're all set up with an account! Now it's time to create your first AI-powered widget and start engaging with your visitors.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleCreateWidget}
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              background: '#ffffff',
              color: 'rgb(79, 70, 229)',
              border: 'none',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
          >
            Create Widget Now
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            I'll do it later
          </button>
        </div>
      </div>
    </div>
  );
}
