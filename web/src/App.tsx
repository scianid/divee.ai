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
import AdReports from './pages/AdReports'
import UsageCost from './pages/UsageCost'
import Articles from './pages/Articles'
import Questions from './pages/Questions'
import Conversations from './pages/Conversations'
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
            <Link to="/#contact">Contact</Link>
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
          <Link to="/#contact" onClick={closeMenu}>Contact</Link>
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
            <Link to="/#demo">Demo</Link>
            <Link to="/#faq">FAQ</Link>
            <Link to="/#contact">Contact</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
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
            padding: '0'
          }}
          onClick={() => setDemoModalOpen(false)}
        >
          <div 
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: '0',
              boxShadow: '0 40px 90px rgba(0, 0, 0, 0.4)',
              width: '100%',
              maxWidth: '1400px',
              height: '100vh',
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
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Get reCAPTCHA Enterprise token
      const captchaToken = await new Promise<string>((resolve, reject) => {
        (window as any).grecaptcha.enterprise.ready(async () => {
          try {
            const token = await (window as any).grecaptcha.enterprise.execute(
              '6LfxcWgsAAAAAPfJRxGjWfrDJ22v-5EVltuWmKoY',
              { action: 'CONTACT_FORM' }
            );
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });

      // Submit to edge function
      const response = await fetch('https://srv.divee.ai/functions/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: data.message || 'Thank you for contacting us!' });
        setContactForm({ name: '', email: '', phone: '', company_name: '' });
      } else {
        setSubmitMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <section id="contact" className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Let's <span className="heroHighlight">talk</span>
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Get started in minutes. Our team typically responds within 24 hours.
            </Reveal>

            <div style={{ maxWidth: '900px', margin: '48px auto 0', display: 'grid', gap: '40px', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr' }}>
              <Reveal delay={180}>
                <form onSubmit={handleContactSubmit} style={{
                  background: '#ffffff',
                  border: '2px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: '20px',
                  padding: '48px 40px',
                  boxShadow: '0 20px 60px rgba(37, 99, 235, 0.12)'
                }}>
                  <div style={{ marginBottom: '28px' }}>
                    <label htmlFor="name" style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '10px',
                      color: '#111827',
                      fontSize: '15px'
                    }}>
                      Your Name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        id="name"
                        required
                        placeholder="John Doe"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '14px 16px 14px 44px',
                          border: '2px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(37, 99, 235)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label htmlFor="email" style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '10px',
                      color: '#111827',
                      fontSize: '15px'
                    }}>
                      Work Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="john@company.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '14px 16px 14px 44px',
                          border: '2px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(37, 99, 235)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label htmlFor="phone" style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '10px',
                      color: '#111827',
                      fontSize: '15px'
                    }}>
                      Phone Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        id="phone"
                        placeholder="+1 (555) 000-0000"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '14px 16px 14px 44px',
                          border: '2px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(37, 99, 235)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label htmlFor="company_name" style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '10px',
                      color: '#111827',
                      fontSize: '15px'
                    }}>
                      Company Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        id="company_name"
                        placeholder="Acme Inc."
                        value={contactForm.company_name}
                        onChange={(e) => setContactForm({ ...contactForm, company_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '14px 16px 14px 44px',
                          border: '2px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '12px',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(37, 99, 235)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                  </div>

                  {submitMessage && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '24px',
                      background: submitMessage.type === 'success' 
                        ? 'rgba(16, 185, 129, 0.08)' 
                        : 'rgba(239, 68, 68, 0.08)',
                      color: submitMessage.type === 'success' 
                        ? '#059669' 
                        : '#dc2626',
                      border: `2px solid ${submitMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                      fontSize: '15px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {submitMessage.type === 'success' ? (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="16 10 10 16 8 14"></polyline>
                        </svg>
                      ) : (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      )}
                      <span>{submitMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '17px',
                      fontWeight: 600,
                      background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
                      fontFamily: 'var(--font-display)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isSubmitting ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)';
                    }}
                  >
                    {isSubmitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                          <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span>Get Started →</span>
                    )}
                  </button>

                  <p style={{ 
                    marginTop: '20px', 
                    fontSize: '13px', 
                    color: '#6b7280', 
                    textAlign: 'center',
                    lineHeight: 1.5
                  }}>
                    We'll never share your information. Protected by reCAPTCHA Enterprise.
                  </p>
                </form>
              </Reveal>

              <Reveal delay={120}>
                <div style={{
                  background: 'rgba(248, 250, 252, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '20px',
                  padding: '40px 32px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: '22px', 
                      fontWeight: 700, 
                      marginBottom: '12px',
                      color: '#111827',
                      fontFamily: 'var(--font-display)'
                    }}>
                      Why Divee.AI?
                    </h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '28px', color: '#6b7280' }}>
                      Join publishers who are seeing 3× longer time-on-site and 45% less bounce.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#111827' }}>Setup in seconds</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>One script tag and you're live</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#111827' }}>No credit card needed</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Start with our free tier</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#111827' }}>Built-in monetization</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>Start earning from day one</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '28px', paddingTop: '28px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                    <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px', fontWeight: 500 }}>Trusted by</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#6b7280',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                      }}>News Sites</span>
                      <span style={{ 
                        background: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#6b7280',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                      }}>Blogs</span>
                      <span style={{ 
                        background: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#6b7280',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                      }}>Magazines</span>
                    </div>
                  </div>
                </div>
              </Reveal>
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
            <a className="btn" href="/#contact" style={{
              color: '#ffffff',
              borderColor: '#ffffff',
              background: 'transparent',
              borderRadius: 12
            }}>
              Contact Us
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
        <Route path="/articles" element={<RequireAuth><Articles /></RequireAuth>} />
        <Route path="/questions" element={<RequireAuth><Questions /></RequireAuth>} />
        <Route path="/conversations" element={<RequireAuth><Conversations /></RequireAuth>} />
        <Route path="/analytics" element={<RequireAuth><Reports /></RequireAuth>} />
        <Route path="/ad-reports" element={<RequireAuth><AdReports /></RequireAuth>} />
        <Route path="/usage-cost" element={<RequireAuth><UsageCost /></RequireAuth>} />
      </Route>
    </Routes>
  )
}
export default App
