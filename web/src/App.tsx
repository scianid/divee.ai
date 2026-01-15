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
            <a href="mailto:hello@divee.ai">Contact</a>
          </div>

          <div className="footerMeta">
            <span>© 2026 Divee.AI. All rights reserved.</span>
            <span className="footerLegal">
              <a href="#top">Privacy</a>
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

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>
    </Routes>
  )
}
export default App
