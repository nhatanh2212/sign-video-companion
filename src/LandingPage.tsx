import { useEffect } from 'react'
import './landing.css'

interface SectionProps {
  id: string
  bg: 'sky' | 'paper'
  className?: string
  children: React.ReactNode
}

function Section({ id, bg, className, children }: SectionProps) {
  return (
    <section
      id={id}
      className={`lp-section lp-section--${bg}${className ? ` ${className}` : ''} lp-fade`}
      data-fade
    >
      <div className="lp-wrap">{children}</div>
    </section>
  )
}

function Eyebrow({ children, dark, className }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <p
      className={`lp-eyebrow${dark ? ' lp-eyebrow--dark' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </p>
  )
}

function NumberedSection({
  id,
  bg,
  num,
  heading,
  children,
}: {
  id: string
  bg: 'sky' | 'paper'
  num: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <Section id={id} bg={bg} className="lp-section--grid">
      <div className="lp-grid">
        <span className="lp-grid__num" aria-hidden="true">
          {num}
        </span>
        <div className="lp-grid__content">
          <h2 className="lp-heading">{heading}</h2>
          {children}
        </div>
      </div>
    </Section>
  )
}

function GoToApp({ onNavigate }: { onNavigate?: (to: string) => void }) {
  return (
    <button
      type="button"
      className="lp-cta"
      onClick={() => onNavigate?.('/app')}
    >
      Try it now
      <span className="lp-cta__arrow" aria-hidden="true">
        →
      </span>
    </button>
  )
}

function AppShot() {
  return (
    <figure
      className="lp-appshot"
      role="img"
      aria-label="The Sign Video Companion player showing a video alongside its transcript, each line translated into signed moments"
    >
      <div className="lp-appshot__bar">
        <span className="lp-appshot__dot lp-appshot__dot--red" aria-hidden="true" />
        <span className="lp-appshot__dot lp-appshot__dot--amber" aria-hidden="true" />
        <span className="lp-appshot__dot lp-appshot__dot--green" aria-hidden="true" />
        <span className="lp-appshot__title">Sign Video Companion — player</span>
      </div>

      <div className="lp-appshot__body">
        <div className="lp-appshot__video">
          <span className="lp-appshot__play" aria-hidden="true">
            ▶
          </span>
          <div className="lp-appshot__track" aria-hidden="true">
            <div className="lp-appshot__fill" />
            <span className="lp-appshot__scrub" />
          </div>
        </div>

        <div className="lp-appshot__rows">
          <div className="lp-appshot__row">
            <span className="lp-appshot__time">00:00</span>
            <span className="lp-appshot__text">The day I decided to try this.</span>
            <span className="lp-appshot__status lp-appshot__status--ok">ready</span>
          </div>
          <div className="lp-appshot__row">
            <span className="lp-appshot__time">00:24</span>
            <span className="lp-appshot__text">I recorded a short video.</span>
            <span className="lp-appshot__status lp-appshot__status--ok">ready</span>
          </div>
          <div className="lp-appshot__row lp-appshot__row--active">
            <span className="lp-appshot__time">01:12</span>
            <span className="lp-appshot__text">Click generate, and watch.</span>
            <span className="lp-appshot__status lp-appshot__status--play">► playing</span>
          </div>
          <div className="lp-appshot__row">
            <span className="lp-appshot__time">01:40</span>
            <span className="lp-appshot__text">Every sentence is its own moment.</span>
            <span className="lp-appshot__status lp-appshot__status--ok">ready</span>
          </div>
        </div>
      </div>

      <div className="lp-appshot__ticker" aria-hidden="true">
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick lp-appshot__tick--active" />
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick" />
        <span className="lp-appshot__tick" />
      </div>
    </figure>
  )
}

function LandingPage({ onNavigate }: { onNavigate?: (to: string) => void }) {
  const goToApp = () => onNavigate?.('/app')

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-fade]')
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-fade--visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15 },
    )
    for (const el of els) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="lp">

      {/* 1. HERO */}
      <section id="hero" className="lp-hero">
        <div className="lp-hero__photo" aria-hidden="true" />
        <div className="lp-hero__glow" aria-hidden="true" />
        <div className="lp-wrap lp-hero__inner lp-fade" data-fade>
          <h1 className="lp-hero__title">Sign video companion.</h1>
          <GoToApp onNavigate={onNavigate} />
        </div>
        <div className="lp-wrap lp-hero__bottom">
          <div className="lp-hero__divider" aria-hidden="true" />
          <p className="lp-hero__scroll">Scroll to see how it works ↓</p>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <NumberedSection id="problem" bg="paper" num="01" heading="The problem">
        <p className="lp-body">
          Captions translate sound into text. For Deaf and hard-of-hearing viewers whose first
          language is sign, that&rsquo;s still a second-language experience — and most video
          content on the internet has no signed interpretation at all.
        </p>
        <p className="lp-body lp-body--muted">
          This isn&rsquo;t a replacement for human interpreters. It&rsquo;s an attempt to cover
          the gap below them.
        </p>
      </NumberedSection>

      {/* 3. IT STARTED WITH A QUESTION */}
      <NumberedSection id="origin" bg="sky" num="02" heading="It started with a question">
        <p className="lp-body">
          If someone&rsquo;s first language is sign, what does watching an ordinary video actually
          feel like for them? Captions answer &ldquo;what was said.&rdquo; They don&rsquo;t answer
          &ldquo;how would this be signed.&rdquo;
        </p>
      </NumberedSection>

      {/* 4. A HYPOTHESIS, NOT A VALIDATED NEED */}
      <NumberedSection id="honesty" bg="paper" num="03" heading="A hypothesis, not a validated need">
        <p className="lp-body">
          I haven&rsquo;t yet had this in front of Deaf or hard-of-hearing users. That validation
          is the next real step — not a footnote.
        </p>
        <span className="lp-vermillion-line" aria-hidden="true" />
      </NumberedSection>

      {/* 5. HOW IT WORKS */}
      <Section id="how" bg="sky" className="lp-section--how">
        <Eyebrow>HOW IT WORKS</Eyebrow>
        <ol className="lp-timeline">
          <li className="lp-timeline__item">
            <span className="lp-timeline__dot" aria-hidden="true" />
            <div className="lp-timeline__body">
              <h3 className="lp-timeline__title">You provide the source</h3>
              <p className="lp-timeline__desc">A local video file and its timestamped transcript.</p>
            </div>
          </li>
          <li className="lp-timeline__item">
            <span className="lp-timeline__dot" aria-hidden="true" />
            <div className="lp-timeline__body">
              <h3 className="lp-timeline__title">Each line is translated</h3>
              <p className="lp-timeline__desc">
                Into a signed pose sequence using open research.
              </p>
            </div>
          </li>
          <li className="lp-timeline__item">
            <span className="lp-timeline__dot" aria-hidden="true" />
            <div className="lp-timeline__body">
              <h3 className="lp-timeline__title">A sync engine maps the timeline</h3>
              <p className="lp-timeline__desc">
                Every segment lands exactly where it should — no drift.
              </p>
            </div>
          </li>
          <li className="lp-timeline__item lp-timeline__item--arrival">
            <span className="lp-timeline__dot" aria-hidden="true" />
            <div className="lp-timeline__body">
              <h3 className="lp-timeline__title">You watch, click, and jump</h3>
              <p className="lp-timeline__desc">Every sentence is its own moment you can replay.</p>
            </div>
          </li>
        </ol>
      </Section>

      {/* 6. STANDING ON REAL RESEARCH */}
      <section id="research" className="lp-section lp-section--paper lp-section--research lp-fade" data-fade>
        <div className="lp-research">
          <div className="lp-research__content">
            <div className="lp-research__inner">
              <span className="lp-grid__num" aria-hidden="true">04</span>
              <h2 className="lp-heading">Standing on real research</h2>
              <p className="lp-body">
                Built on open translation research from{' '}
                <a
                  href="https://rylo.com/sign/translate/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-nav-link"
                >
                  Rylo Translate
                </a>{' '}
                (sign.mt), not reinvented from scratch. Licensed CC BY-NC-SA 4.0 — this stays a
                non-commercial project.
              </p>
            </div>
          </div>
          <figure className="lp-research__media">
            <img
              src="https://images.unsplash.com/photo-1551240903-154be3f2e18b?w=900&q=70"
              alt="A quiet research workspace with books and papers"
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      {/* 8. WHAT IT LOOKS LIKE TODAY */}
      <NumberedSection id="product" bg="sky" num="05" heading="What it looks like today">
        <p className="lp-body">
          Upload a video. Upload its transcript. Click generate. Watch a sign-language
          interpretation appear alongside your video, broken into clickable moments.
        </p>
        <AppShot />
      </NumberedSection>

      {/* 9. WHAT'S NEXT */}
      <NumberedSection id="next" bg="paper" num="06" heading="What&rsquo;s next">
        <p className="lp-body">
          Put this in front of Deaf and hard-of-hearing users first. Then support videos without
          existing captions. Then decide — based on that feedback, not assumption — whether this
          interaction is the right shape at all.
        </p>
      </NumberedSection>

      {/* 10. FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer__glow" aria-hidden="true" />
        <div className="lp-wrap lp-footer__inner lp-fade" data-fade>
          <Eyebrow dark>LOOKING AHEAD</Eyebrow>
          <h2 className="lp-footer__title">Try it now.</h2>
          <button type="button" className="lp-cta lp-cta--lg" onClick={goToApp}>
            Open Sign Video Companion
            <span className="lp-cta__arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
        <div className="lp-wrap lp-footer__credits">
          <p>
            Powered by{' '}
            <a href="https://rylo.com/sign/translate/" target="_blank" rel="noopener noreferrer">
              Rylo Translate
            </a>{' '}
            (sign.mt) — CC BY-NC-SA 4.0
          </p>
          <p className="lp-footer__credits-unsplash">
            Photos via{' '}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage