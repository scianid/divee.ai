import { Reveal } from '../components/Reveal'

export default function Projects() {
  return (
    <div className="container section" style={{ paddingTop: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="sectionTitle">Accounts</h1>
          <p className="sectionLead" style={{ marginTop: '8px', fontSize: '16px' }}>Manage user account settings and profile.</p>
        </div>
      </div>

      <Reveal className="card" style={{ padding: '48px', textAlign: 'center', borderStyle: 'dashed' }}>
         <p style={{ fontSize: '18px', color: 'var(--text)', opacity: 0.7 }}>Account settings coming soon.</p>
      </Reveal>
    </div>
  )
}
