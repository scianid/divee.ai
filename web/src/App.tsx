import { useEffect, useState } from 'react'
import { Link, Routes, Route, Outlet, useLocation } from 'react-router-dom'
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
  { q: 'How long does setup take?', a: 'Less than 5 minutes. One script tag and you’re live.' },
  {
    q: 'Does it work with my CMS?',
    a: 'Yes. Works with WordPress, Webflow, Custom HTML, React, Vue, and any platform that supports JavaScript.',
  },
  { q: 'Will it slow down my site?', a: 'No. The widget loads asynchronously and stays lightweight.' },
  {
    q: "Can I customize the AI's tone and personality?",
    a: 'Absolutely. Configure voice, formality, and guardrails per project.',
  },
  {
    q: 'What if the AI gives wrong answers?',
    a: 'Responses are grounded in the article with citations, so readers can verify instantly. You can also review and tune behavior in the dashboard.',
  },
  { q: 'Do I need technical skills?', a: 'Nope. If you can copy‑paste, you can install Divee.AI.' },
]

const features = [
  {
    title: 'Context-Aware Intelligence',
    body: 'Answers are derived from your article—not generic web results. Every response stays grounded with citations.',
  },
  {
    title: 'Smart Question Suggestions',
    body: 'AI-generated prompts invite engagement before readers think about leaving.',
  },
  {
    title: 'Real-Time Streaming',
    body: 'Typewriter-style responses that feel natural and immediate.',
  },
  {
    title: 'Multi-Language + RTL',
    body: 'Serve global audiences with full RTL support for Hebrew, Arabic, and more.',
  },
  {
    title: 'Fully Customizable',
    body: 'Match your brand—colors, messaging, positioning, and behavior.',
  },
  {
    title: 'Built-In Monetization',
    body: 'Integrated ad slots that don’t interrupt the reading experience.',
  },
]

const useCases = [
  { title: 'News Publishers', body: 'Keep readers engaged with breaking stories.' },
  { title: 'Content Marketers', body: 'Turn educational content into lead magnets.' },
  { title: 'Technical Writers', body: 'Make complex topics accessible instantly.' },
  { title: 'Educational Platforms', body: 'Enhance learning with interactive Q&A.' },
  { title: 'Enterprise Blogs', body: 'Build authority and capture intent data.' },
]

function MarketingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
              src="https://vdbmhqlogqrxozaibntq.supabase.co/storage/v1/object/public/public-files/divee.ai-logo.png" 
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
            <a className="btn btnPrimary" href="/#cta">
              See demo
            </a>
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
          <a className="btn btnPrimary" href="#cta" onClick={closeMenu}>
            See demo
          </a>
        </nav>
      </header>
      
      <Outlet />

      <footer className="footer">
        <div className="container footerInner">
          <div className="footerBrand">
            <div className="brandRow">
              <img 
                src="https://vdbmhqlogqrxozaibntq.supabase.co/storage/v1/object/public/public-files/divee.ai-logo.png" 
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
    </div>
  )
}


function LandingPage() {
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
                Divee.AI keeps readers on‑page with instant, citation‑grounded answers—so they can explore deeper without
                opening new tabs.
              </Reveal>

              <Reveal className="heroCtas" delay={240}>
                <a className="btn btnPrimary" href="#cta">
                  See Demo
                </a>
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
                    It means readers will expect instant, citation‑grounded answers on‑page—and publishers who deliver
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
              Your readers are leaving money on the table
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
              <Reveal className="statCard" delay={180}>
                <div className="statNum">Every bounce</div>
                <div className="statLabel">is a lost opportunity to engage</div>
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
            <Reveal as="h2" className="sectionTitle" delay={0}>
              An AI assistant for every article
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Embed a conversational widget that knows your content inside and out. Readers get instant answers—you get
              deeper engagement.
            </Reveal>
            <Reveal className="callout" delay={140}>
              <strong>No new tabs.</strong> No external searches. Just pure, on‑page interaction.
            </Reveal>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Built for publishers, loved by readers
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Production-grade features designed to improve engagement without disrupting the reading flow.
            </Reveal>

            <div className="cardGrid">
              {features.map((f, idx) => (
                <Reveal key={f.title} className="card" delay={120 + idx * 70}>
                  <h3 className="cardTitle">{f.title}</h3>
                  <p className="cardBody">{f.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section sectionAlt">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Results that matter
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
        </section>

        <section className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Perfect for
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Teams who publish content and want to keep readers engaged—right where they already are.
            </Reveal>

            <div className="cardGrid">
              {useCases.map((u, idx) => (
                <Reveal key={u.title} className="card" delay={120 + idx * 70}>
                  <h3 className="cardTitle">{u.title}</h3>
                  <p className="cardBody">{u.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="section sectionAlt">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Live in minutes, not weeks
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              One script tag. A few brand settings. You’re ready to ship.
            </Reveal>

            <div className="scrolly">
              <div className="scrollySteps">
                <Reveal className="step" delay={120}>
                  <div className="stepNum">1</div>
                  <div>
                    <div className="stepTitle">Sign up</div>
                    <div className="stepBody">Get your unique project ID instantly—no credit card required.</div>
                  </div>
                </Reveal>
                <Reveal className="step" delay={170}>
                  <div className="stepNum">2</div>
                  <div>
                    <div className="stepTitle">Customize</div>
                    <div className="stepBody">Set colors, welcome message, and behavior in your dashboard.</div>
                  </div>
                </Reveal>
                <Reveal className="step" delay={220}>
                  <div className="stepNum">3</div>
                  <div>
                    <div className="stepTitle">Embed</div>
                    <div className="stepBody">Add one line of code to your site.</div>
                  </div>
                </Reveal>
                <Reveal className="step" delay={270}>
                  <div className="stepNum">4</div>
                  <div>
                    <div className="stepTitle">Go live</div>
                    <div className="stepBody">Readers can now chat with every article. Track engagement in real time.</div>
                  </div>
                </Reveal>
              </div>

              <Reveal className="scrollySticky" delay={140}>
                <div className="codeCard" aria-label="Embed snippet">
                  <div className="codeTitle">Embed snippet</div>
                  <pre className="codeBlock">
{`<script src="https://cdn.prismai.com/widget.js"
        data-project-id="your-project-id"></script>`}
                  </pre>
                  <div className="codeHint">Loads asynchronously. No layout shift.</div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              What publishers are saying
            </Reveal>

            <div className="quoteGrid">
              <Reveal className="quote" delay={120}>
                <p>
                  “Divee.AI turned our long‑form guides into interactive experiences. Engagement is through the roof.”
                </p>
                <div className="quoteBy">— Sarah M., Content Director</div>
              </Reveal>
              <Reveal className="quote" delay={190}>
                <p>“The Hebrew RTL support is flawless. Our readers love asking follow‑ups in their native language.”</p>
                <div className="quoteBy">— David L., Editor</div>
              </Reveal>
              <Reveal className="quote" delay={260}>
                <p>“We finally have data on what our readers actually care about. Game changer.”</p>
                <div className="quoteBy">— Maria K., Analytics Lead</div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section sectionAlt">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              Enterprise‑grade security
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Built for scale, designed for trust.
            </Reveal>

            <div className="securityGrid">
              <Reveal className="securityItem" delay={120}>
                <div className="securityTitle">Zero direct database access</div>
                <div className="securityBody">All requests flow through secure edge functions.</div>
              </Reveal>
              <Reveal className="securityItem" delay={190}>
                <div className="securityTitle">GDPR & privacy aligned</div>
                <div className="securityBody">Your data stays yours—always.</div>
              </Reveal>
              <Reveal className="securityItem" delay={260}>
                <div className="securityTitle">99.9% uptime SLA</div>
                <div className="securityBody">Designed for global publisher traffic patterns.</div>
              </Reveal>
              <Reveal className="securityItem" delay={330}>
                <div className="securityTitle">Row‑level isolation</div>
                <div className="securityBody">Strict separation across client projects.</div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="demo" className="section">
          <div className="container">
            <Reveal as="h2" className="sectionTitle" delay={0}>
              See the widget live
            </Reveal>
            <Reveal as="p" className="sectionLead" delay={80}>
              Experience the on‑page AI assistant in action before you ship.
            </Reveal>
            <Reveal className="demoActions" delay={140}>
              <a className="btn btnPrimary" href="#cta">
                <PlayIcon style={{ marginRight: 8 }} aria-hidden="true" />
                Watch demo
              </a>
              <a className="btn btnSecondary" href="#cta">
                Get a live walkthrough
              </a>
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
            <a className="btn btnPrimary" href="#top">
              Start free trial
            </a>
            <a className="btn btnSecondary" href="mailto:hello@divee.ai">
              Email hello@divee.ai
            </a>
          </Reveal>
          <Reveal as="p" className="ctaHint" delay={200}>
            14 days, no credit card required. Questions? Schedule a demo.
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
