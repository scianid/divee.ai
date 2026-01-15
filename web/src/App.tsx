import { useEffect, useState } from 'react'
import { Link, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { Reveal } from './components/Reveal'

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

function Layout() {
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
          <a className="brand" href="#top" aria-label="Divee.AI">
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
            <a className="btn btnPrimary" href="#cta">
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
                Turn static cotent into {' '}
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

function TermsPage() {
  return (
    <main id="main" className="section">
      <div id="top" />
      <div className="container">
        <h1 className="sectionTitle">Terms of Service</h1>
        <p className="sectionLead">Divee Terms of Service</p>
        <div className="termsContent">
          <p>
            These Terms of Use are a binding agreement between TME Ventures LTD. ("Company," "us" "our" or "we")
            and you, the person or legal entity who uses (the "User," "you" "your") this website and any of its
            subdomains, related forms, landing pages (together, the "Website"), and any content, material, product,
            service or feature provided or made available through the Website (together with the Website, the
            "Services"). These Terms of Use, together with any other agreements, policies (including the Privacy
            Policy available at: https://divee.ai/privacy-policy or any other terms incorporated thereto by reference
            shall hereby be collectively referred to as the "Terms".
          </p>
          <p>
            By accessing or using our Services, you agree to these Terms. Your use of the Services is expressly
            conditioned on your compliance and consent with these Terms. If you do not agree to any of the provisions
            of the Terms you should immediately stop using the Services.
          </p>
          <p>
            Use of and access to the Services are void where prohibited by law. By using the Services, you represent
            and warrant that your use of the Services does not violate any applicable law or regulation, and that you
            are above the age of majority as determined by the applicable law in your jurisdiction of residency.
          </p>

          <h3>The Services; Restrictions On Use</h3>
          <p>
            We grant you a personal, non-transferable, non-exclusive, revocable, limited license to access and use
            the Services solely as permitted by these Terms. We reserve all rights not expressly granted to you by
            these Terms.
          </p>
          <p>Except as permitted through the Services or as otherwise permitted by us in writing, your license does not include the right to:</p>
          <ul className="termsList">
            <li>license, sell, transfer, assign, distribute, host, or otherwise commercially exploit the Services, our Website, or any content made available through our Services.</li>
            <li>modify, prepare derivative works of, disassemble, decompile, or reverse engineer any part of the Services.</li>
            <li>access the Services or any content made available through our Website in order to build a similar or competing website, product, or service, unless otherwise agreed or licensed by us.</li>
            <li>reproduce, duplicate, copy or re-sell any part of our Services, unless otherwise agreed by us pursuant to a licensing agreement.</li>
          </ul>
          <p>Without derogation from any other restrictions on your use of the Services contained herein or elsewhere in these Terms, you may only use the Services for lawful purposes, and you will not:</p>
          <ul className="termsList">
            <li>use the Services in any way which breaches any applicable local, national or international law or regulation, or in any way that is unlawful or fraudulent.</li>
            <li>attempt to gain unauthorized access to the Services (or to other computer systems or networks connected to or used together with the Services).</li>
            <li>knowingly transmit any data, send or upload any material that contains viruses, Trojan horses, worms, time-bombs, keystroke loggers, spyware, adware or any other harmful programs or similar computer code designed to adversely affect the operation of any computer software or hardware.</li>
            <li>act in any manner that could interfere with, damage, disrupt, or negatively affect, or inhibit other users from fully enjoying the Services or that could damage, disable, overburden, or impair the functioning of the Services in any manner.</li>
            <li>use the Services (including any webpage or data that passes through our web domain), domain names, URLs, databases, functions or its content other than for private, non-commercial purposes.</li>
            <li>use of any automated system, software, or manual process, whether operated by a third party or otherwise, to extract any data from the Services absent our written consent.</li>
            <li>act in any way which would infringe ours, or any person or entity's intellectual property, or any other proprietary rights.</li>
            <li>attempt to harvest, collect, gather or assemble information or data regarding the Website, the Services, the content or any other user of the Services.</li>
          </ul>

          <h3>Intellectual Property</h3>
          <p>
            The Company owns (or has valid authorizations or licenses required for) the Services, as well as the
            materials provided through its Services, including all worldwide intellectual property rights in the
            Services, and the trademarks, service marks, and logos contained therein (subject to such trademarks,
            service marks, and logos which are expressly denoted as belonging to third parties). All rights in the
            foregoing and all rights not expressly granted hereunder are reserved by the Company to the fullest
            extent permitted under any applicable law.
          </p>
          <p>
            In addition, we will own any intellectual property in respect of features or functionalities of the
            Services that are based on your suggestions, improvements or feedback. You hereby grant us a license to
            use the data inputted by you for the purpose of using the Services or facilitating the use of the
            Services, including any feedback, comments or suggestions provided by you to enable us to provide the
            Services or to incorporate the feedback into the Services.
          </p>
          <p>
            Except as expressly permitted herein, you may not copy, modify, duplicate, distribute, display,
            perform, sublicense, decipher, decompile, reverse engineer, translate, port, republish, retransmit,
            reproduce, create derivative works of, transfer, sell or otherwise use the Services, any content
            appearing on the Services, or any material that is subject to our proprietary rights. You may not use
            any of the foregoing to create any software or service similar to the Services.
          </p>
          <p>
            You will not remove, alter or conceal any copyright, trademark, service mark or other proprietary
            rights notices incorporated in the Services. All trademarks are trademarks or registered trademarks of
            their respective owners. Nothing in these Terms grants you any right to use any trademark, service
            mark, logo, or trade name of the Company or any third party.
          </p>
          <p>
            You may not or attempt to (a) circumvent, disable, or otherwise interfere with security-related
            features of the Services or features that prevent or restrict use or copying of any content; (b) use
            any robot, spider, website search or retrieval service, or any other manual or automatic device or
            process to retrieve, index, data-mine, or in any way reproduce or circumvent the navigational structure
            or presentation of the Service; or (c) harvest, collect or mine information about users of the
            Services.
          </p>

          <h3>Content Ownership</h3>
          <p>By uploading video content to Divee, you acknowledge and agree that:</p>
          <ol className="termsList">
            <li>Ownership Rights: You are the sole owner of all video content uploaded to Divee’s platform. You can upload videos that you appear in or helped create (as the Director, Editor, Musician, Motion Graphics Artist, Actor, etc), as long as you have the necessary permissions from the copyright holders.</li>
            <li>Exclusive Rights: You acknowledge that Divee has the exclusive right to use, reproduce, modify, distribute, display and perform the uploaded content in any media formats and through any media channels, whether now known or hereafter developed.</li>
            <li>Public domain videos are not allowed.</li>
            <li>Certain types of content are not allowed on Divee. No sexually explicit material or pornography. (Artistic and non-sexual nudity is allowed.) No videos that are hateful, harass others, or include defamatory or discriminatory speech. No videos that depict or promote unlawful acts, extreme or real-life violence, self-harm, or cruelty toward animals.</li>
            <li>Divee can remove any content from the platform at its sole discretion.</li>
          </ol>

          <h3>Breach of our Terms</h3>
          <p>
            We take all breaches of our Terms seriously and if we do consider that a breach of these Terms has
            occurred, we may take such action as we deem appropriate, which may extend to any one or all of the
            following (without limiting any right or remedy available to us under applicable laws): the immediate,
            suspension or permanent removal of your right to use our Services; issuing a warning to you; legal
            action against you, which may extend to legal proceedings against you for reimbursement of all costs on
            an indemnity basis (including, but not limited to, reasonable administrative and legal costs) resulting
            from the breach; and disclosure of such information to law enforcement authorities as we reasonably
            feel is necessary or as required by law.
          </p>
          <p>
            We exclude any and all liability for all actions we may take in response to breaches of our Terms.
            The actions we may take are not limited to those described above, and we may take any other action we
            reasonably deem appropriate.
          </p>

          <h3>Third Party Websites</h3>
          <p>
            The Services may contain links to websites or services that are not maintained by the Company. Links to
            third party websites or services are provided for your convenience and information only. Third party
            websites and services are not under the Company’s control and the Company is not responsible for the
            content or accuracy of those websites or services offered on or through those links. The inclusion of a
            link through the Services does not imply the Company’s endorsement of the third party website or
            services or that the Company is affiliated with the owners or sponsors of those websites or services.
          </p>
          <p>
            You acknowledge and agree that we are not liable for any loss or damage which may be incurred by you as
            a result of the availability of those external websites, services, resources or advertisements, or as a
            result of any reliance placed by you on the completeness, accuracy or existence of any advertising,
            products or other materials on, or available from, such websites or resources. We recommend that you be
            aware when you leave the Services and to read the terms and conditions and privacy policy of each other
            website or services that you visit or use.
          </p>

          <h3>Disclaimers of Warranties</h3>
          <p>
            THE SERVICES ARE PROVIDED ON AN "AS IS", "AS AVAILABLE" AND "WITH ALL FAULTS" BASIS, AND COMPANY
            DISCLAIMS ALL WARRANTIES OF ANY KIND, EXPRESS, IMPLIED OR STATUTORY, INCLUDING BUT NOT LIMITED TO
            RELIABILITY OF THE SERVICES, WARRANTIES OF NON-INFRINGEMENT OR IMPLIED WARRANTIES OF USE,
            MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE OR USE. WE DISCLAIM ALL LIABILITY AND ANY
            OBLIGATIONS FOR ANY HARM OR DAMAGE CAUSED BY ANY THIRD-PARTY HOSTING PROVIDERS. WITHOUT LIMITING THE
            FOREGOING, THE COMPANY EXPLICITLY DISCLAIMS ANY WARRANTIES, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT
            LIMITATION, WARRANTIES OF MERCHANTABILITY, AND FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT AND
            QUALITY OF SERVICE. THE USE OF THE CONTENT PROVIDED IN THE SERVICES IS AT THE USER'S SOLE
            RESPONSIBILITY AND THE COMPANY SHALL NOT BE RESPONSIBLE FOR, AND SHALL NOT BE HELD LIABLE, IN ANY WAY,
            FOR ANY DAMAGE OR LOSS THAT MAY BE CAUSED, EITHER DIRECTLY OR INDIRECTLY, DUE TO THE USE OF THE
            SERVICES. THE COMPANY MAKES NO WARRANTY THAT THE SERVICES WILL MEET YOUR EXPECTATIONS, WILL BE FREE
            FROM VIRUSES OR THAT DATA AND CONTENT OBTAINED THROUGH THE SERVICES WILL BE ACCURATE, RELIABLE OR
            CURRENT, OR THAT THE SERVICES WILL BE AVAILABLE ON AN UNINTERRUPTED, SECURE, OR ERROR-FREE BASIS. YOU
            ACKNOWLEDGE AND AGREE THAT USE OF THE SERVICES IS AT YOUR OWN DISCRETION AND SOLE RISK AND THAT THE
            ENTIRE RISK AS TO THE RESULTS AND PERFORMANCE OF THE SERVICES, INCLUDING, WITHOUT LIMITATION, ANY
            DAMAGES TO YOUR COMPUTER SYSTEM, MOBILE DEVICE OR DATA STORED ON IT, IS SOLELY YOURS.
          </p>
          <p>
            SOME STATES OR JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES. ACCORDINGLY, SOME OF THE
            ABOVE EXCLUSIONS MAY NOT APPLY TO YOU.
          </p>

          <h3>Limitation of Liability</h3>
          <p>
            YOU ACKNOWLEDGE AND AGREE THAT IN NO EVENT WILL THE COMPANY (INCLUDING, WITHOUT LIMITATION, ITS
            AFFILIATES AND THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES AND AGENTS) BE LIABLE FOR ANY DIRECT,
            INDIRECT, SPECIAL, PUNITIVE, INCIDENTAL OR CONSEQUENTIAL DAMAGES OR LOSSES (INCLUDING, WITHOUT
            LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF PROGRAMS OR
            INFORMATION, AND THE LIKE) ARISING OUT OF YOUR USE OF OR INABILITY TO USE THE SERVICES, OR IMPROPER
            USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY THEREOF AND REGARDLESS OF THE FORM
            OF ACTION, WHETHER IN CONTRACT, TORT, OR OTHERWISE. YOU FURTHER ACKNOWLEDGE AND AGREE THAT THE COMPANY
            MAY CHANGE THE SERVICES IN WHOLE OR IN PART IN ITS SOLE DISCRETION WITHOUT NOTICE TO YOU AND WITHOUT
            ANY LIABILITY TO YOU WHATSOEVER IN CONNECTION THEREWITH. THESE LIMITATIONS WILL NOT APPLY TO THE
            EXTENT PROHIBITED BY LAW.
          </p>

          <h3>Indemnification</h3>
          <p>
            You shall defend, indemnify, and hold harmless the Company, its affiliates and each of their
            employees, contractors, directors, officers, suppliers, agents, service providers and representatives
            from all liabilities, losses, claims, and expenses (including without limitation to reasonable
            attorney’s fees), including, but not limited to, with respect to any third party claims that arise from
            or relates to: your access, use or misuse of the Services; your breach of any provision of these Terms
            or of any applicable law, contract, policy, regulation or other obligation; your negligence, intentional
            misconduct, or fraud.
          </p>
          <p>
            The Company reserves the right to assume the exclusive defense and control of any matter otherwise
            subject to indemnification by you, in which event you will assist and fully cooperate with the Company
            in connection therewith.
          </p>

          <h3>Changes to the Services</h3>
          <p>
            We reserve the right to modify, correct, amend, enhance, improve, make any other changes to, or
            discontinue, temporarily or permanently, in whole or in party, the Services without notice, at any
            time. You agree that your continued use of the Services following such modifications constitutes your
            acceptance of such modifications.
          </p>

          <h3>Term and Termination</h3>
          <p>
            These Terms commence upon your first use of the Services and will remain in effect until terminated or
            expired. You may stop using the Services at any time, at your sole discretion. The Company may stop
            providing the Website, and may terminate use of it at any time upon its sole discretion without giving
            notice of termination to you. Upon any termination, (a) the rights granted to you in these Terms will
            end; (b) you shall stop using the Services.
          </p>
          <p>
            The provisions of these Terms that, by their nature and content, must survive the termination of these
            Terms in order to achieve the fundamental purposes of these Terms shall so survive.
          </p>
          <p>
            Without limiting the generality of the foregoing, the Intellectual Property Rights, Disclaimers of
            Warranties, Limitation of Liability, Governing Law and Jurisdiction and General sections, will survive
            the termination or expiration of the Terms.
          </p>

          <h3>Governing Law and Jurisdiction</h3>
          <p>
            These Terms are governed by the laws of Israel, and the competent courts of Tel Aviv shall have
            exclusive jurisdiction over all disputes between the parties related to these Terms; notwithstanding
            the foregoing, the Company may file a suit for collection of payment in any country where you or your
            entity are located.
          </p>

          <h3>General</h3>
          <p>
            Changes to Terms. Company may change the Terms from time to time, and such change will become effective
            upon the date on which it is posted on the Website. You are responsible for checking the Website
            regularly for such changes. By continuing to access or use the Services you agree to be bound by the
            revised Terms.
          </p>
          <p>
            Severability. If any part of these Terms is deemed unlawful, void or for any reason unenforceable, then
            that provision shall be deemed to be severable from the rest of these Terms and shall not affect the
            validity and enforceability of any of the remaining provisions of these Terms. In such cases, the part
            deemed invalid or unenforceable shall be construed in a manner consistent with applicable law to
            reflect, as closely as possible, the original intent of the parties.
          </p>
          <p>
            Waiver. No failure or delay on the part of any party in exercising any right or remedy under these
            Terms shall operate as a waiver thereof, nor shall any single or partial exercise of any such right or
            remedy preclude any other or further exercise thereof or the exercise of any other right or remedy.
          </p>
          <p>
            Relationship. Nothing in these Terms shall be construed as creating any agency, partnership, trust
            arrangement, fiduciary relationship or any other form of joint enterprise between you and Company.
          </p>
          <p>
            Entire Agreement. These Terms contain the entire agreement between Company and you relating to your use
            of the Services and supersedes any and all prior agreements between Company and you in relation to the
            same. You confirm that, in agreeing to accept these Terms, You have not relied on any representation
            except as has expressly been made by Company in these Terms.
          </p>
          <p>
            Assignment. You may not assign your rights or delegate your obligations under these Terms without
            Company’s prior written consent. Any purported assignment contrary to this section will be null and
            void and without effect. Company may assign its obligations under these Terms without your consent and
            without notice or obligation to you.
          </p>
          <p>
            No Third-Party Rights. There are no third-party beneficiaries to these Terms.
          </p>
          <p>
            Force Majeure. Company shall not be responsible for any failure to perform any obligation or provide
            any service hereunder because of any (a) act of God, (b) war, riot or civil commotion, (c) governmental
            acts or directives, strikes, work stoppage, or equipment or facilities shortages, or (d) other similar
            cause beyond Company’s reasonable control. For the avoidance of doubt, any problems relating to the
            hosting of the Services shall not be deemed within Company’s reasonable control.
          </p>

          <h3>Communication</h3>
          <p>
            If you have any questions about these Terms or about the Company in general, please contact us using the
            "About" form available here: https://divee.ai/about.
          </p>
        </div>
      </div>
    </main>
  )
}

function PrivacyPage() {
  return (
    <main id="main" className="section">
      <div id="top" />
      <div className="container">
        <h1 className="sectionTitle">Privacy Policy</h1>
        <p className="sectionLead">Divee Privacy Policy</p>
        <div className="termsContent">
          <p>
            Introduction
          </p>
          <p>
            Welcome to Divee, an online Article AI platform (“Platform”), provided to you by TME Ventures LTD. (the
            "Company", "we", or "us"). We also operate the website https://www.divee.ai, its subdomains and its
            related features (“Website”). In this Policy, the Website, Platform and any service, content material or
            feature made available thereon are collectively referred to as the “Services”). This Policy is
            integrated into and forms part of our Terms of Use (“Terms”).
          </p>
          <p>
            This Privacy Policy (“Policy”) was designed to help you understand the information we collect, store, use
            and share, and it applies whenever you visit or interact with our Services. Please note that parts of this
            Policy may not be applicable to you, depending on the jurisdiction in which you reside and the applicable
            laws.
          </p>
          <p>
            By accessing and/or using any of the Services, you acknowledge that we may collect and process
            information about you as set forth in this Privacy Policy. We strongly urge you to read this Policy and
            make sure that you fully understand and agree to it. If you do not agree to this Policy, please
            discontinue and avoid using our Services. You have the right to cease using our Services at any time,
            pursuant to this policy and our terms. You are not legally required to provide us with any Personal Data,
            but without it we will not be able to provide you with certain Services or the best experience of using
            our Services.
          </p>
          <p>
            If you share any Personal Data with us relating to third party individuals, you represent and warrant
            that you have the legal authority to do so, and that you have obtained the third party’s informed,
            specific consent to the processing of their Personal Data in accordance with this Privacy Policy.
          </p>

          <h3>How We Collect the Personal Data</h3>
          <p>We collect, receive, and process information about you through:</p>
          <ul className="termsList">
            <li>Your interaction with us;</li>
            <li>Your use of our Services including when publishers and advertisers that use our Services provide us with information about employees who are authorized to use the Services under their account;</li>
          </ul>

          <h3>1. What Types of Data Do We Collect?</h3>
          <p>
            “Personal Data” means any information which could potentially allow your identification with reasonable
            means as well as “personal information” or any similar terms used under applicable privacy laws. This
            section sets out how and when we collect and process Personal Data about you.
          </p>
          <p><strong>a. Contact Details</strong> In the event you contact us for support or other inquiries, either through the online form available on the Website, by sending us an email or by other means of communications we make available, you will be requested to provide us your name, email address, and your phone number, if required.</p>
          <p><strong>b. Account Information</strong> If you choose to register an account with our Services, we collect your full name, email address, phone number, birthdate and username. If you choose to log in, access or otherwise connect to the Services through a social networking service (such as Facebook, Twitter, Instagram, etc.), we collect your user ID and username associated with that social networking service, as well as any information you make public using that social networking service or that the social networking service allows us to access.</p>
          <p><strong>c. Online Identifiers</strong> When you access our Services, we may, either directly or indirectly collect your IP address and other online or device identifiers (for example Advertising ID and IDFA). We may also collect technical non-Personal Data.</p>
          <p><strong>d. Recruitment</strong> In the event you are interested in joining our team, and wish to apply for a job with us, you will be required to provide us with your name, email address, and CV.</p>
          <p><strong>e. Registration Information</strong> We may collect Personal Data that you are required to submit to us when you engage with us, such as your or your personnel’s (in the event applicable) name, email address, other contact details, and payment details.</p>
          <p><strong>f. Third Party Information Regarding Interaction with Our Services</strong></p>
          <p><strong>g.</strong> In the event you are an end user of our partners interacting with our media player, our partners using our Services (and consequently us), may collect certain information for the purpose or displaying personalized ads. This Personal Data may include online identifiers and other behavioural related information, including IP address and mobile related identifiers (for example Advertising ID and IDFA). Please note that this Privacy Policy refers solely to our privacy practices. We do not control, monitor nor have any responsibility for any matter related to our partners’ privacy practices. Please refer to the privacy policy of the relevant partner (i.e., the website or content you were browsing) you are interacting with for more information. For information regarding opt out options (whether you are using desktop or mobile device), please see the Tracking Technologies paragraph below.</p>

          <h3>2. Personal Data</h3>
          <p>This section explains the purposes of processing your Personal Data and outlines the legal bases that underlie our usage.</p>

          <h3>2.1. Why Do We Process Your Personal Data?</h3>
          <p>Purpose / Legal basis</p>
          <p><strong>Support.</strong> We may use our your personal data, such as your email, name, phone number or other means of communication to provide you with the support or information you have requested. We also collect (from our Website directly, or indirectly from our partners' properties) certain online identifiers as described above, as part of our Services to such partner. We will use the email address to send information related to the Services and our business engagement. We may process online identifiers during the provision of our services. The legal basis for processing your data is the performance of our contractual obligations with you; your consent; and our legitimate interests. Our legitimate interests in this case are provision of our Services including support.</p>
          <p><strong>Payments.</strong> We may collect your payment details in order to provide you with our services. The legal bases for processing this data are the performance of our contractual obligations, and your consent.</p>
          <p><strong>Improve our Services and Improve your user experience.</strong> We collect your IP address for the purposes of usability, quality, functionality and effectiveness of our Services, including debugging to identify and repair errors and undertake internal research for technological development and demonstration. The legal basis for processing this data is your consent and our legitimate interest. Our legitimate interests in this case are providing and improving our Services and performing analytics on the use of our Services.</p>
          <p><strong>Recruitment.</strong> We collect the names, email addresses and CV of those who are interested in joining our team. We do not request or require sensitive Personal Data concerning religion, health, sexual orientation, or political affiliation in connection with recruiting. We will use the information provided solely for communication, to manage our recruiting and hiring processes, and for compliance with corporate governance and legal and regulatory requirements. If hired, the information may be used in connection with employment and corporate management. The legal basis for processing this data is your consent, and our legitimate interests. Our legitimate interests in this case include performing a proper recruiting process for our candidates, record keeping and the protection from potential legal claims.</p>
          <p><strong>Auditing related to counting ad impressions</strong> of unique visitors, verifying positioning and quality of ad impressions, and auditing compliance with relevant specification and standards. The legal basis for processing this data is your consent (for example, as obtained through our or our partners' cookie consent mechanisms), and our legitimate interest. Our legitimate interest in this case is providing you with our Services, including the provision of content that better corresponds with your interests, providing monetization services to our partners, and the performance of analytics, security and fraud detection, and campaign reporting.</p>
          <p><strong>Integrity.</strong> We process certain information about you and your usage of our Services in order to keep the integrity and security of our Services, prevent fraud, identify your identity and enforce our policies. The legal basis for processing this data are compliance with our legal obligations and our legitimate interests. Our legitimate interests in this case are keeping the integrity of our Services; detection of fraudulent activities; and the safety of our end-users.</p>
          <p><strong>Compliance with applicable laws; assistance to law enforcement agencies.</strong> We process your Personal Data in order to comply with our legal obligation under applicable laws and contractual obligations. The legal bases for processing this data are compliance with our legal obligations and our legitimate interests. Our legitimate interests in this case are compliance with our legal obligations and assisting law enforcement agencies.</p>
          <p>We may aggregate and/or anonymize information collected through the Services. We may use de-identified and/or aggregated data for any purpose, including without limitation for research and marketing purposes, and may also share such data with any third parties, including advertisers, promotional partners, sponsors, and/or others.</p>

          <h3>3. Tracking Technologies</h3>
          <p>When you access or use the Services, we may use “cookies” (or similar tracking technologies), which store certain information on your device (i.e., locally stored) and which will allow us to enhance your experience of the site. The use of cookies is a standard industry-wide practice. A cookie is a small piece of information that a website assigns and stores on your device while you are viewing a website. For more information about how we use cookies and other tracking mechanisms on the Website and when providing our Services, please refer to our Cookie Policy.</p>

          <h3>4. Disclosure of Your Data</h3>
          <p>Divee may disclose your Personal Data as provided below.</p>
          <p><strong>Legal Compliance; Safety:</strong> We may disclose or allow government and law enforcement officials access to your Personal Data in response to a subpoena, search warrant or court order (or similar requirement), or in compliance with applicable laws and regulations, with or without notice to you. Such disclosure or access may occur if we believe that: (1) we are legally compelled to do so; (2) disclosure is appropriate in connection with efforts to investigate, prevent, or take action regarding actual or suspected illegal activity, counter terrorist financing verification requirements fraud, or other wrongdoing; or (3) such disclosure is required to protect our employees or third parties, or our business interests, including the security or integrity of our Services.</p>
          <p><strong>Vendors:</strong> We engage vendors to support the operation of our business, and these vendors may process your Personal Data. These vendors may include hosting and server co-location services, operating systems and platforms, data analytics services, marketing and advertising services, data and cyber security services, fraud detection and prevention services, banks, financial institutions, customer engagement services, billing and payment processing services, web analytics, e-mail and SMS distribution and monitoring services, session or activity recording services, remote access services, performance measurement, support and customer relation management systems, our business, legal, tax, financial and compliance advisors and other vendors and service providers.</p>
          <p><strong>Advertising and Analytics:</strong> We may disclose or make available some of your Personal Data with advertising and analytics partners to serve advertisements on our behalf across the internet and to provide analytics services. These entities may use cookies and tracking technologies to allow us to track and analyze data, deliver advertising and content that may interest you and better understand your online activity.</p>
          <p><strong>Divee Subsidiaries and Affiliated Companies; Change of Control:</strong> We may disclose your Personal Data internally within our affiliates for the purposes described in this Privacy Policy. In addition, should Divee or any of its affiliates undergo any change in control or ownership, including by means of merger, acquisition or purchase of substantially all or part of its assets, Personal Data may be shared with the parties involved in such an event, including in the diligence or negotiations in anticipation of such an event.</p>
          <p><strong>Disclosure with Consent/At Your Direction:</strong> We may disclose your Personal Data to third parties when you consent to a particular disclosure. Please note that once we share your information with a third party, that information becomes subject to the third party’s privacy practices.</p>
          <p><strong>Aggregated/De-Identified Data:</strong> We may disclose information that has been aggregated or de-identified, as such information is not subject to this Privacy Policy.</p>

          <h3>5. Marketing and advertising</h3>
          <p>We use your personal data ourselves or by using our third-party subcontractors for the purpose of providing you with promotional materials, ads, products, services, websites, and applications which relate to our affiliated companies or our business partners (collectively: “Marketing Affiliates”), which we believe may interest you.</p>
          <p>You can decline receiving further marketing offers from us or from our business partners and Marketing Affiliates at any time, by contacting us at privacy@divee.ai. Please note that even if you unsubscribe from our marketing-mailing list, we can continue to send you service-related updates and notifications.</p>

          <h3>6. Your rights</h3>
          <p>6.1 Depending on the jurisdiction in which you reside, you may have certain rights under relevant applicable laws regarding the collection and processing of your personal data. To the extent these rights apply and concern you, you can contact us via the contact details available below and ask to exercise the following rights:</p>
          <p><strong>(a)</strong> Rights of access to your Personal Data. You have the right to receive confirmation as to whether or not Personal Data concerning you is being processed, and access your stored Personal Data, together with supplementary information.</p>
          <p><strong>(b)</strong> Right of data portability. You have the right to request us to move, copy and transfer your Personal Data easily from one IT environment to another, in a safe and secure way, without affecting its usability.</p>
          <p><strong>(c)</strong> Right of rectification. You have the right to request rectification of your Personal Data in our control in the event that your believe the Personal Data held by the Company is inaccurate, incomplete or outdated.</p>
          <p><strong>(d)</strong> Right of deletion/erasure. You have the right to request that the Company erase or delete Personal Data held about you at any time.</p>
          <p><strong>(e)</strong> Right to restriction or objection to processing. You have the right to request that the Company restrict or cease to conduct certain Personal Data processes at any time.</p>
          <p><strong>(f)</strong> Right to withdraw your consent. To the extent we process Personal Data on the basis of your consent, you have the right to withdraw your given consent at any time.</p>
          <p><strong>(g)</strong> Right to limit use and disclosure of your sensitive Personal Data. You have the right to request to limit the collection of your sensitive Personal Data, to that use which is necessary to perform our Services.</p>
          <p><strong>(h)</strong> Right not to be subject to automated decision making. You have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects or similarly significantly effects to you.</p>
          <p><strong>(i)</strong> Right to Opt-Out of the Sale or share of Personal Data. In the event that we sell or share your Personal Data for behavioural advertising purposes, you have the right to submit a request to opt-out of the sale or share of your Personal Data. After you opt-out, we may continue disclosing some Personal Data with our partners to help us perform business-related functions such as, but not limited to, providing the Services, ensuring that the Services is working correctly and securely, providing aggregate statistics and analytics, and preventing fraud.</p>
          <p><strong>(j)</strong> Right to non-discrimination. You have the right to be free from any discrimination for exercising your rights, such as offering you different pricing or products, or by providing you with a different level or quality of services, based solely upon your request.</p>
          <p><strong>(k)</strong> Right to lodge a complaint and appeal our decisions. All requests, complaints or queries may be addressed to the Company to the following email address: privacy@divee.ai. We will consider any requests, complaints or queries and provide you with a reply in a timely manner. We take our obligations seriously and we ask that any concerns are first brought to our attention, so that we can try to resolve them. To the extent you feel unsatisfied with our response to your request to exercise your rights, you may choose to send us a request to appeal our decision. If you are unsatisfied with our response, you can lodge a complaint with the applicable data protection supervisory authority.</p>
          <p>Please note that these rights are not absolute, and may be subject to the relevant applicable laws, our own legitimate interests and regulatory requirements.</p>
          <p>We provide you with the ability to exercise certain choices and controls in connection with our treatment of your Personal Data, depending on your relationship with us. You may exercise any or all of your above rights in relation to your Personal Data by filling out the Data Subject Request form available here and send it to our privacy team at privacy@divee.ai.</p>

          <h3>6.2 Authorized Agent</h3>
          <p>(a) You can use an authorized agent to make a request to exercise your right under applicable laws on your behalf if: (i) The authorized agent is a natural person or a business entity; and (ii) You sign a written declaration that you authorize the authorized agent to act on your behalf. If you use an authorized agent to submit a request to exercise your right, please provide us with a certified copy of your written declaration authorizing the authorized agent to act on your behalf using the contact information below.</p>
          <p>(b) The request must: (i) Provide sufficient information to allow us to reasonably verify you are the person about whom we collected Personal Data or an authorized agent. We cannot respond to your request or provide you with Personal Data if we cannot verify your identity or authority to make the request and confirm the Personal Data relates to you; and (ii) Describe your request with sufficient details to allow us to properly understand, evaluate, and respond to it.</p>
          <p>(c) We will only use Personal Data provided in a verifiable consumer request to verify the requestor's identity or authority to make the request. Making a verifiable consumer request does not require you to create an account with us.</p>

          <h3>7. Transfer of Personal Data</h3>
          <p>We operate globally, thus any information that we collect, disclose or share, including your Personal Data, may be stored and processed in various jurisdictions worldwide. This includes countries that may not offer the same level of data protection as your country of residence including (but not limited to) the European Economic Area, United Kingdom and United States, for the purposes detailed in this Policy.</p>

          <h3>8. How We Protect Your Data?</h3>
          <p>We implement technical, organizational, and administrative systems to secure your Personal Data, to minimize the risks of theft, damage, loss of information, or unauthorized access or use of information and limit access to your information on our servers. The data collected by us is stored in the AWS data servers, for more information regarding the data security provided by AWS, please see: https://aws.amazon.com/security/. While we implement reasonable security measures to protect information, we cannot be held liable for the actions of third parties who gain unauthorized access to or abuse our Services. We do not warrant or guarantee that our Services will be completely secure against all potential vulnerabilities, including malfunctions, technical issues, unlawful interceptions, or access, or other forms of compromise that may affect your privacy. No express or implied warranty is provided regarding our ability to prevent such unauthorized access.</p>

          <h3>9. Minors</h3>
          <p>Our Services are not designed for and we do not knowingly collect or process Personal Data from minors under the age of majority (as determined under applicable laws where such individual resides; “Minors”). By accessing, using or interacting with our Services, you certify to us that you are not a Minor. In the event that we have collected Personal Data from a Minor without verification of parental or legal guardianship's consent, we will delete that information upon discovery. If you believe that we might have any information from or about a Minor, then please contact us immediately through the contact details available below.</p>

          <h3>10. Links to Third-Party Services</h3>
          <p>Links to other websites, services, and applications that are not operated or controlled by Divee (“Third-Party Services”) may be contained in our Services. This Privacy Policy does not apply to the Third-Party Services. Please review the applicable privacy statements of any Third-Party Services before providing any information to or through them.</p>

          <h3>11. Retention</h3>
          <p>We will retain your Personal Data for as long as it is reasonably necessary to achieve the stated purposes of collection. We will also retain information as needed to and as necessary to comply with our legal obligations, resolve disputes, and enforce our policies. Retention periods will be determined to take into account the type of information that is collected and the purpose for which it is collected, bearing in mind the requirements applicable to the situation and the need to destroy or amend outdated, unused information at the earliest reasonable time.</p>

          <h3>12. Additional Privacy Information for Certain Jurisdictions</h3>
          <h3>12.1 Additional Information for California Residents</h3>
          <p>Disclosures of Personal Data</p>
          <p>In this section, we provide additional information to California residents about how we handle their personal data in accordance with the California Consumer Privacy Act (“CCPA”). We do not "sell" your personal data, as this term is defined under CCPA.</p>
          <p>In the 12 preceding months, we have shared or disclosed the following categories of your personal data:</p>
          <p>Identifiers: Real name, alias, postal address, unique personal identifier, online identifier, Internet Protocol address, email address, account name, address, telephone number. The data was shared with Service providers, data aggregators and business partners.</p>
          <p>Internet or other electronic network activity data: Browsing history, search history, information on a consumer’s interaction with a website, application, or advertisement. The data was shared with Service providers, data aggregators and business partners.</p>
          <p>Professional or employment-related data Current or past job history or performance evaluations. The Data was shared with service providers (such HR services providers and recruitment agencies).</p>
          <p>Geolocation data (non precise) Physical location or movements, including the location of your device location or movement. The data was shared with Service providers, data aggregators and business partners.</p>
          <p>In the 12 preceding months, we have collected personal data from the following categories of sources: (a) Consumer directly; (b) Advertising networks; (c) Internet service providers; (d) Data analytics providers; (e) Social Networks; and (f) Data Brokers.</p>
          <p>In the past 12 months, we did not receive any requests to delete, to know, to opt-put of selling, sharing or to limit use and disclosure of sensitive Personal Data.</p>
          <p>We will publish metrics regarding the number of such requests we have received, complied with (in whole or in part) or denied, and also the median or mean number of days in which we responded to such requests, in the previous year (these metrics are compiled annually and refer to the period between July 1st of the previous year to July 1st of the following year) once we receive such requests, and to the extent required under the CCPA laws.</p>

          <h3>13. Updates to this Policy</h3>
          <p>We reserve the right to change this Policy at any time. The most current version will always be posted through our Services (as reflected in the “Last Updated” heading). You are advised to check for updates regularly. By continuing to access or use our Services after any revisions become effective, you agree to be bound by the updated Policy. In the event of any substantial change of this policy, we will make reasonable efforts to post a clear notice on the site. Such substantial changes will take effect seven (7) days after such notice was provided on the site, dashboard or sent by email. Notwithstanding the above this Policy will be reviewed and updated every 12 months, as required under the CCPA.</p>

          <h3>14. Controlling Version</h3>
          <p>This Policy has been drafted in the English language, which is the original and controlling version of this Policy. All translations of this Policy into other languages shall be solely for convenience and shall not control the meaning or application of this Policy. In the event of any discrepancy between the meanings of any translated versions of the Policy and the English language version, the meaning of the English language version shall prevail.</p>

          <h3>15. Data Protection Officer</h3>
          <p>The Company has appointed a “Data Protection Officer” who is responsible for matters relating to privacy and data protection. If you have any requests regarding the data collected under this Privacy Policy, including without limitation, requests to remove, delete, amend, modify or transfer the data, please contact our Data Protection Officer at: dpo@divee.ai. Please include your name, address and email address in any correspondence so that we can respond to your inquiry or request.</p>

          <h3>16. IAB Transparency & Consent Framework</h3>
          <p>Divee participates in the IAB Europe Transparency & Consent Framework. Divee’s identification number within the framework is 862.</p>

          <h3>17. Contact us</h3>
          <p>If you have any further questions, please contact us by email at: privacy@divee.ai</p>
        </div>
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
    </Routes>
  )
}
export default App
