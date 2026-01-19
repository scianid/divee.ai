import { useEffect, useState } from 'react'
import { Link, Routes, Route, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { Reveal } from './components/Reveal'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Accounts from './pages/Accounts'
import { RequireAuth } from './components/RequireAuth'
import Reports from './pages/Reports'
import Inventory from './pages/Inventory'
import TermsPage from './pages/Terms'
import PrivacyPage from './pages/Privacy'
import { DashboardLayout } from './layouts/DashboardLayout'

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="currentColor"
        d="M9 7.5v9l8-4.5-8-4.5Zm3-5.5C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8Z"
      />
    </svg>
  )
}

type FAQ = { q: string; a: string }

const faqs: FAQ[] = [
  { q: 'How long does setup take?', a: 'Less than a minute. One script tag and you’re live.' },
  {
    q: 'Does it work with my CMS?',
    a: 'Yes. Works with WordPress, Webflow, Custom HTML, React, Vue, and any platform that supports JavaScript.',
  },
  { q: 'Will it slow down my site?', a: 'No. The widget loads asynchronously and stays lightweight.' },
  {
    q: "Can I customize the AI's tone and personality?",
    a: 'Absolutely. Configure voice, formality, and guardrails per project.',
  },
  { q: 'Do I need technical skills?', a: 'Nope. If you can copy‑paste, you can install Divee.AI.' },
]

const features = [
  {
    title: 'Context-Aware Intelligence',
    body: 'Answers are derived from your article not generic web results. Every response stays grounded with citations.',
  },
  {
    title: 'Smart Question Suggestions',
    body: 'AI-generated prompts invite engagement before readers think about leaving.',
  },
  {
    title: 'Lightweight & Fast',
    body: 'Our lean SDK loads asynchronously without blocking your page. Zero layout shift, minimal footprint.',
  },
  {
    title: 'Multi-Language + RTL',
    body: 'Serve global audiences with full RTL support for Hebrew, Arabic, and more.',
  },
  {
    title: 'Fully Customizable',
    body: 'Match your brand colors, messaging, positioning, and behavior.',
  },
  {
    title: 'Built-In Monetization',
    body: 'Integrated ad slots that don’t interrupt the reading experience.',
  },
]

function MarketingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMenu = () => setMobileMenuOpen(false)

  useEffect(() => {
    if (!location.hash) return
    const targetId = location.hash.replace('#', '')
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div className="app">
      <a className="skipLink" href="#main">
        Skip to content
      </a>

      <header className="navWrap">
        <div className="nav container">
          <a className="brand" href="/#top" aria-label="Divee.AI">
            <img 
              src="https://srv.divee.ai/storage/v1/object/public/public-files/divee.ai-logo.png" 
              alt="Divee.AI logo" 
              className="brandLogo"
            />
            <span className="brandText">Divee.AI</span>
          </a>

          <nav className="navLinks" aria-label="Primary">
            <Link to="/#features">Features</Link>
            <Link to="/#how">How it works</Link>
            <Link to="/#demo">Demo</Link>
            <Link to="/#faq">FAQ</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>

          <button 
            className="hamburger" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburgerLine" />
            <span className="hamburgerLine" />
            <span className="hamburgerLine" />
          </button>

          <div className="navCtas">
            <Link className="btn btnSecondary" to="/login" style={{ marginRight: '10px' }}>
              Login
            </Link>
            <button className="btn btnPrimary" onClick={() => setDemoModalOpen(true)}>
              See Demo
            </button>
          </div>
        </div>

        <nav className={`mobileMenu ${mobileMenuOpen ? 'open' : ''}`} aria-label="Mobile">
          <Link to="/#features" onClick={closeMenu}>Features</Link>
          <Link to="/#how" onClick={closeMenu}>How it works</Link>
          <Link to="/#demo" onClick={closeMenu}>Demo</Link>
          <Link to="/#faq" onClick={closeMenu}>FAQ</Link>
          <Link to="/terms" onClick={closeMenu}>Terms</Link>
          <Link to="/privacy" onClick={closeMenu}>Privacy</Link>
          <Link to="/login" onClick={closeMenu} className="btn btnSecondary">Login</Link>
          <button className="btn btnPrimary" onClick={() => { setDemoModalOpen(true); closeMenu(); }}>
            See Demo
          </button>
        </nav>
      </header>
      
      <Outlet context={{ setDemoModalOpen }} />

      <footer className="footer">
        <div className="container footerInner">
          <div className="footerBrand">
            <div className="brandRow">
              <img 
                src="https://srv.divee.ai/storage/v1/object/public/public-files/divee.ai-logo.png" 
                alt="Divee.AI logo" 
                className="brandLogo"
              />
              <span className="brandText">Divee.AI</span>
            </div>
            <p className="footerTag">Publishing For The AI Era</p>
          </div>

          <div className="footerLinks" aria-label="Footer">
            <Link to="/#features">Features</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/#demo">Demo</Link>
            <Link to="/#faq">FAQ</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <a href="mailto:hello@divee.ai">Contact</a>
          </div>

          <div className="footerMeta">
            <span>© 2026 Divee.AI. All rights reserved.</span>
            <span className="footerLegal">
              <Link to="/privacy">Privacy</Link>
              <span aria-hidden="true">·</span>
              <Link to="/terms">Terms</Link>
              <span aria-hidden="true">·</span>
              <a href="#top">Security</a>
            </span>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {demoModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setDemoModalOpen(false)}
        >
          <div 
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 40px 90px rgba(0, 0, 0, 0.4)',
              width: '100%',
              maxWidth: '1400px',
              height: '90vh',
              maxHeight: '900px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))'
            }}>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                color: '#ffffff', 
                margin: 0,
                fontFamily: 'var(--font-display)'
              }}>
                Live Demo
              </h3>
              <button
                onClick={() => setDemoModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Iframe */}
            <iframe
              src="/demo.html#auto-scroll"
              onLoad={(e) => {
                setTimeout(() => {
                  try {
                    const iframe = e.currentTarget;
                    iframe.contentWindow?.postMessage({ action: 'scrollToBottom' }, '*');
                  } catch (err) {
                    console.log('Could not send message to iframe:', err);
                  }
                }, 1000);
              }}
              style={{
                flex: 1,
                border: 'none',
                width: '100%',
                height: '100%'
              }}
              title="Divee.AI Demo"
            />
          </div>
        </div>
      )}
    </div>
  )
}


function LandingPage() {
  const { setDemoModalOpen } = useOutletContext<{ setDemoModalOpen: (open: boolean) => void }>();
  return (
    <main id="main">
      <section id="top" className="hero">
          <div className="aurora" aria-hidden="true">
            <div className="auroraLayer a1" />
            <div className="auroraLayer a2" />
            <div className="auroraLayer a3" />
          </div>

          <div className="container heroGrid">
            <div className="heroCopy">
              <Reveal as="p" className="eyebrow" delay={0}>
                Publishing for the AI era
              </Reveal>

              <Reveal as="h1" className="heroTitle" delay={80}>
                Turn static content into {' '}
                <span className="heroHighlight">interactive experiences</span>.
              </Reveal>

              <Reveal as="p" className="heroSub" delay={160}>
                Divee.AI keeps readers on‑page with instant, citation‑grounded answers so they can explore deeper without
                opening new tabs.
              </Reveal>

              <Reveal className="heroCtas" delay={240}>
                <button className="btn btnPrimary" onClick={() => setDemoModalOpen(true)}>
                  See Demo
                </button>
              </Reveal>

             
            </div>

            <Reveal className="heroMock" delay={140}>
              <div className="mockCard">
                <div className="mockHeader">
                  <div className="mockDot" />
                  <div className="mockDot" />
                  <div className="mockDot" />
                  <div className="mockTitle">Divee.AI Widget</div>
                </div>

                <div className="mockBody">
                  <div className="bubble bubbleUser">Summarise this article for me.</div>
                  <div className="bubble bubbleAi">
                    The article argues that publishers should shift from static pages to interactive, AI‑assisted
                    experiences to keep readers engaged and monetize attention.
                    <div className="cite">Sources: Intro, “Engagement” section</div>
                  </div>
                  <div className="bubble bubbleUser">What does this mean for 2026?</div>
                  <div className="bubble bubbleAi">
                    It means readers will expect instant, citation‑grounded answers on‑page and publishers who deliver
                    that will see longer sessions and higher retention.
                  </div>
                  <div className="bubble bubbleThinking" aria-label="Assistant is thinking" />
                </div>

                <div className="mockInput" aria-hidden="true">
                  <div className="mockField">Ask a question…</div>
                  <div className="mockSend" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Your readers are leaving <span className="heroHighlight">money on the table</span>
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Readers skim, bounce, and open new tabs to understand your content. Each exit is lost engagement,
              monetization, and loyalty.
            </Reveal>

            <div className="statGrid">
              <Reveal className="statCard" delay={120}>
                <div className="statNum">73%</div>
                <div className="statLabel">skim and leave within 2 minutes</div>
              </Reveal>
              <Reveal className="statCard" delay={180} style={{ 
                background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
                borderColor: 'rgba(79, 70, 229, 0.4)'
              }}>
                <div className="statNum" style={{ color: 'rgba(232, 244, 250, 0.98)' }}>Every bounce</div>
                <div className="statLabel" style={{ color: 'rgba(232, 244, 250, 0.86)' }}>is a lost opportunity to engage</div>
              </Reveal>
              <Reveal className="statCard" delay={240}>
                <div className="statNum">Every search</div>
                <div className="statLabel">is revenue walking out the door</div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section sectionAlt">
          <div className="container">
            <div className="splitSection imageLeft">
              <div>
                <Reveal as="h2" className="sectionTitle" delay={0}>
                  An <span className="heroHighlight">AI assistant</span> for every article
                </Reveal>
                <Reveal as="p" className="sectionLead" delay={80}>
                  Embed a conversational widget that knows your content inside and out. Readers get instant answers you get
                  deeper engagement.
                </Reveal>
                <Reveal className="callout" delay={140}>
                  <strong>No new tabs.</strong> No external searches. Just pure, on‑page interaction.
                </Reveal>
              </div>
              <Reveal delay={180}>
                <img 
                  src="https://srv.divee.ai/storage/v1/object/public/public-files/divee.ai.open.1.jpg" 
                  alt="AI assistant in action" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Built for publishers, <span className="heroHighlight">loved by readers</span>
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Production-grade features designed to improve engagement without disrupting the reading flow.
            </Reveal>

            <div className="cardGrid">
              {features.map((f, idx) => (
                <Reveal 
                  key={f.title} 
                  className="card" 
                  delay={120 + idx * 70}
                  style={f.title === 'Context-Aware Intelligence' || f.title === 'Built-In Monetization' ? {
                    background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
                    borderColor: 'rgba(79, 70, 229, 0.4)'
                  } : undefined}
                >
                  <h3 
                    className="cardTitle"
                    style={f.title === 'Context-Aware Intelligence' || f.title === 'Built-In Monetization' ? {
                      color: 'rgba(232, 244, 250, 0.98)'
                    } : undefined}
                  >
                    {f.title}
                  </h3>
                  <p 
                    className="cardBody"
                    style={f.title === 'Context-Aware Intelligence' || f.title === 'Built-In Monetization' ? {
                      color: 'rgba(232, 244, 250, 0.86)'
                    } : undefined}
                  >
                    {f.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section sectionAlt">
          <div className="container">
            <div className="splitSection imageRight">
              <div>
                <Reveal as="h2" className="sectionTitle" delay={0}>
                  <span className="heroHighlight">Results</span> that matter
                </Reveal>
                <Reveal as="p" className="sectionLead" delay={80}>
                  Publishers use Divee.AI to turn passive pages into interactive experiences.
                </Reveal>

                <div className="resultGrid">
                  <Reveal className="result" delay={120}>
                    <div className="resultNum">3×</div>
                    <div className="resultLabel">longer time‑on‑site</div>
                  </Reveal>
                  <Reveal className="result" delay={180}>
                    <div className="resultNum">45%</div>
                    <div className="resultLabel">reduction in bounce rate</div>
                  </Reveal>
                  <Reveal className="result" delay={240}>
                    <div className="resultNum">2.8×</div>
                    <div className="resultLabel">more page views per session</div>
                  </Reveal>
                  <Reveal className="result" delay={300}>
                    <div className="resultNum">Intent data</div>
                    <div className="resultLabel">see what readers actually want</div>
                  </Reveal>
                </div>
              </div>
              <Reveal delay={360}>
                <img 
                  src="https://srv.divee.ai/storage/v1/object/public/public-files/divee.ai.open.2.jpg" 
                  alt="Results dashboard" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </Reveal>
            </div>
          </div>
        </section>

        
        <section className="section">
          <div className="container">
            <div className="splitSection imageLeft">
              <div>
                <Reveal as="h2" className="sectionTitle" delay={0}>
                  Your <span className="heroHighlight">command center</span>
                </Reveal>
                <Reveal as="p" className="sectionLead" delay={80}>
                  Track engagement, analyze user intent, and optimize performance from a unified dashboard.
                </Reveal>
                <Reveal delay={140}>
                  <div className="cardGrid" style={{ marginTop: '32px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="card">
                      <div className="cardTitle">Real-time analytics</div>
                      <p className="cardBody">
                        Monitor interactions, impressions, and engagement metrics as they happen
                      </p>
                    </div>
                    <div className="card">
                      <div className="cardTitle">Intent discovery</div>
                      <p className="cardBody">
                        See what questions readers are asking to inform your content strategy
                      </p>
                    </div>
                    <div className="card">
                      <div className="cardTitle">Brand customization</div>
                      <p className="cardBody">
                        Match your brand with custom colors, logos, and widget styling
                      </p>
                    </div>
                    <div className="card">
                      <div className="cardTitle">Instant deployment</div>
                      <p className="cardBody">
                        Push changes and manage multiple projects from one place
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
              <Reveal delay={180}>
                <img 
                  src="https://srv.divee.ai/storage/v1/object/public/public-files/dashboard.jpg" 
                  alt="Dashboard analytics" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </Reveal>
            </div>
          </div>
        </section>

        
        <section id="how" className="section sectionAlt">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Live in <span className="heroHighlight">seconds</span>
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              One script tag. A few brand settings. You’re ready to ship.
            </Reveal>

            <div className="cardGrid" style={{ marginTop: '48px' }}>
              <Reveal className="card" delay={120}>
                <div className="stepNum" style={{ marginBottom: '16px' }}>1</div>
                <div className="cardTitle">Sign up & Customize</div>
                <p className="cardBody">Get your unique project ID for your website instantly.</p>
              </Reveal>
              <Reveal className="card" delay={220}>
                <div className="stepNum" style={{ marginBottom: '16px' }}>2</div>
                <div className="cardTitle">Embed</div>
                <p className="cardBody">Add one line of code to your site, super small and fast loading.</p>
              </Reveal>
              <Reveal className="card" delay={270}>
                <div className="stepNum" style={{ marginBottom: '16px' }}>3</div>
                <div className="cardTitle">Go live</div>
                <p className="cardBody">Readers can now chat with every article. Track engagement in real time.</p>
              </Reveal>
            </div>

            <Reveal delay={140} style={{ marginTop: '48px' }}>
              <div className="codeCard" aria-label="Embed snippet" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="codeTitle">Embed snippet</div>
                <pre className="codeBlock" style={{ overflow: 'auto' }}>
                  <code>
                    <span style={{ color: '#ff6b9d' }}>&lt;script</span>{' '}
                    <span style={{ color: '#ffc777' }}>src</span>
                    <span style={{ color: '#c8d3f5' }}>=</span>
                    <span style={{ color: '#c3e88d' }}>"https://srv.divee.ai/storage/v1/object/public/sdk/divee.sdk.latest.js"</span>{' '}
                    {'\n  '}
                    <span style={{ color: '#ffc777' }}>data-project-id</span>
                    <span style={{ color: '#c8d3f5' }}>=</span>
                    <span style={{ color: '#c3e88d' }}>"your-project-id"</span>{' '}
                    {'\n  '}
                    <span style={{ color: '#ffc777' }}>data-article-class</span>
                    <span style={{ color: '#c8d3f5' }}>=</span>
                    <span style={{ color: '#c3e88d' }}>"your-article-class"</span>
                    <span style={{ color: '#ff6b9d' }}>&gt;</span>
                    {'\n'}
                    <span style={{ color: '#ff6b9d' }}>&lt;/script&gt;</span>
                  </code>
                </pre>
                <div className="codeHint">Loads asynchronously. No layout shift.</div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="demo" className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              See <span className="heroHighlight">Divee.AI in action</span>
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Try the widget yourself on a live article. Ask questions, explore features, and see how readers will interact with your content.
            </Reveal>
            
            <Reveal delay={120} style={{ marginTop: '32px' }}>
              <img 
                src="https://srv.divee.ai/storage/v1/object/public/public-files/divee.ai.jpg" 
                alt="Divee.AI in action" 
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  height: 'auto',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                  margin: '0 auto',
                  display: 'block'
                }}
              />
            </Reveal>
            
            <Reveal delay={140} style={{ marginTop: '32px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(17, 65, 141, 0.05) 0%, rgba(35, 163, 182, 0.05) 100%)',
                border: '2px solid',
                borderImage: 'linear-gradient(135deg, #11418d 0%, #23a3b6 100%) 1',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '24px' }}>
                
                  <p style={{ fontSize: '16px', color: '#374151', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
                    Click below to open a real article with Divee.AI embedded. Try asking questions like "Summarize this article" or "What are the key points?"
                  </p>
                </div>
                
                <div className="demoActions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btnPrimary" 
                    onClick={() => setDemoModalOpen(true)}
                    style={{
                      padding: '14px 28px',
                      fontSize: '16px',
                      gap: '10px'
                    }}
                  >
                    <PlayIcon style={{ width: 20, height: 20 }} aria-hidden="true" />
                    Try Live Demo
                  </button>
                  <a 
                    className="btn btnSecondary" 
                    href="#cta"
                    style={{
                      borderRadius: 12,
                      padding: '14px 28px',
                      fontSize: '16px'
                    }}
                  >
                    Schedule Walkthrough
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="faq" className="section sectionAlt">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Frequently asked questions
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Quick answers to the most common questions from publishers.
            </Reveal>

            <div className="faq">
              {faqs.map((item, idx) => (
                <Reveal key={item.q} className="faqItem" delay={120 + idx * 60}>
                  <div className="faqQ">{item.q}</div>
                  <div className="faqA">{item.a}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      <section id="cta" className="cta">
        <div className="container ctaInner">
          <Reveal as="h2" className="ctaTitle" delay={0}>
            Ready to transform your content?
          </Reveal>
          <Reveal as="p" className="ctaLead" delay={80}>
            Start engaging readers like never before.
          </Reveal>
          <Reveal className="ctaActions" delay={140}>
            <a className="btn" href="mailto:hello@divee.ai" style={{
              color: '#ffffff',
              borderColor: '#ffffff',
              background: 'transparent',
              borderRadius: 12
            }}>
              Email hello@divee.ai
            </a>
          </Reveal>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
      
      <Route path="/login" element={<Login />} />

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<RequireAuth><Accounts /></RequireAuth>} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
        <Route path="/analytics" element={<RequireAuth><Reports /></RequireAuth>} />
      </Route>
    </Routes>
  )
}
export default App
