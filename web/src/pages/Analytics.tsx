export default function Analytics() {
  return (
    <div className="container section">
      <h1 className="sectionTitle">Reports</h1>
      <p className="sectionLead">Insights into your readership.</p>
      <div className="statGrid" style={{ marginTop: '30px' }}>
        <div className="statCard">
            <div className="statNum">0</div>
            <div className="statLabel">Active Readers</div>
        </div>
        <div className="statCard">
            <div className="statNum">0%</div>
            <div className="statLabel">Engagement Rate</div>
        </div>
      </div>
    </div>
  )
}
