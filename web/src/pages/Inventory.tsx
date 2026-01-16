import { Reveal } from '../components/Reveal'

export default function Inventory() {
  return (
    <div className="container section">
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="sectionTitle">Inventory</h1>
          <p className="sectionLead" style={{ marginTop: '8px', fontSize: '16px' }}>Manage your ad slots and assets.</p>
        </div>
        <button className="btn btnPrimary">+ Add Item</button>
      </div>

      <Reveal className="card" style={{ padding: '48px', textAlign: 'center', borderStyle: 'dashed' }}>
         <p style={{ fontSize: '18px', color: 'var(--text)', opacity: 0.7 }}>Inventory management coming soon.</p>
      </Reveal>
    </div>
  )
}
