import { useEffect } from 'react'
import './landing.css'

interface SectionProps {
  id: string
  bg: 'blue' | 'paper'
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
      {children}
    </section>
  )
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`lp-tag${className ? ` ${className}` : ''}`}>{children}</p>
}

function NumberedSection({
  id,
  bg,
  num,
  tag,
  heading,
  children,
}: {
  id: string
  bg: 'blue' | 'paper'
  num: string
  tag?: string
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
          {tag && <Tag>{tag}</Tag>}
          <h2 className="lp-heading">{heading}</h2>
          {children}
        </div>
      </div>
    </Section>
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
      { threshold: 0.2 },
    )
    for (const el of els) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="lp">

      {/* 1. HERO */}
      <section id="hero" className="lp-hero">
        <div className="lp-hero__glow" aria-hidden="true" />
        <div className="lp-hero__inner lp-fade" data-fade>
          <p className="lp-hero__label">Sign Video Companion</p>
          <h1 className="lp-hero__title">
            A sign-language companion for the videos that would otherwise have{' '}
            <span className="lp-maru">none.</span>
          </h1>
        </div>
        <nav className="lp-hero__nav" aria-label="Site">
          <button type="button" className="lp-pill lp-pill--solid" onClick={goToApp}>
            Try it now →
          </button>
        </nav>
      </section>

      {/* 2. THE PROBLEM */}
      <NumberedSection
        id="problem"
        bg="paper"
        num="01"
        tag="The Problem"
        heading="It started with a question"
      >
        <p className="lp-body">
          Captions translate sound into text. For Deaf and hard-of-hearing viewers whose first
          language is sign, that&rsquo;s still a second-language experience — and most video
          content on the internet has no signed interpretation at all, because professional
          interpretation doesn&rsquo;t scale to every video that exists.
        </p>
        <p className="lp-body lp-body--aside">
          This isn&rsquo;t a replacement for human interpreters. It&rsquo;s an attempt to cover
          the gap below them — the personal videos, niche content, and everyday clips that would
          otherwise never get signed by anyone.
        </p>
      </NumberedSection>

      {/* 3. AN HONEST STARTING POINT */}
      <NumberedSection
        id="stand"
        bg="blue"
        num="02"
        tag="Where this stands"
        heading="A hypothesis, not a validated need"
      >
        <p className="lp-body">
          I want to be direct about where this stands. I built this because the gap seemed real
          and worth testing — I have not yet had this in front of Deaf or hard-of-hearing users
          to confirm it solves a problem they actually feel, versus one I assumed on their behalf.
          That validation is the next real step, not a footnote. A tool like this is only worth
          existing if the people it&rsquo;s for find it more useful than just reading captions,
          and that&rsquo;s a question only they can answer.
        </p>
        <span className="lp-vermillion-line" aria-hidden="true" />
      </NumberedSection>

      {/* 5. HOW IT WORKS */}
      <Section id="how" bg="paper" className="lp-section--how">
        <div className="lp-how">
          <Tag className="lp-tag--center">How it works</Tag>
          <ol className="lp-timeline">
            <li className="lp-timeline__item">
              <span className="lp-timeline__dot" aria-hidden="true" />
              <div className="lp-timeline__body">
                <h3 className="lp-timeline__title">You provide the source</h3>
                <p className="lp-timeline__desc">A video and the transcript that goes with it.</p>
              </div>
            </li>
            <li className="lp-timeline__item">
              <span className="lp-timeline__dot" aria-hidden="true" />
              <div className="lp-timeline__body">
                <h3 className="lp-timeline__title">Each line is translated</h3>
                <p className="lp-timeline__desc">Into a signed pose sequence, in order.</p>
              </div>
            </li>
            <li className="lp-timeline__item">
              <span className="lp-timeline__dot" aria-hidden="true" />
              <div className="lp-timeline__body">
                <h3 className="lp-timeline__title">A sync engine maps the timeline</h3>
                <p className="lp-timeline__desc">Aligning every sign to the moment it belongs to.</p>
              </div>
            </li>
            <li className="lp-timeline__item lp-timeline__item--arrival">
              <span className="lp-timeline__dot" aria-hidden="true" />
              <div className="lp-timeline__body">
                <h3 className="lp-timeline__title">You watch, click, and jump</h3>
                <p className="lp-timeline__desc">Straight to the part you want to see signed again.</p>
              </div>
            </li>
          </ol>
        </div>
      </Section>

      {/* 6. STANDING ON REAL RESEARCH */}
      <Section id="research" bg="blue" className="lp-section--research">
        <div className="lp-research">
          <div className="lp-research__content">
            <span className="lp-grid__num lp-research__num" aria-hidden="true">03</span>
            <h2 className="lp-heading">Standing on real research, not reinventing it</h2>
            <p className="lp-body">
              The translation itself comes from open research and tooling built by{' '}
              <a
                href="https://rylo.com/sign/translate/"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-nav-link"
              >
                Rylo Translate
              </a>{' '}
              (sign.mt), created by Amit Moryossef. Sign language translation is a genuinely hard
              machine learning problem, and rebuilding it from scratch wasn&rsquo;t the point. My
              work was the product and integration layer on top: taking a research-grade capability
              and shaping it into something with a clickable, timed, usable shape.
            </p>
            <p className="lp-body lp-body--muted">
              Worth naming plainly: that research is licensed CC BY-NC-SA — non-commercial,
              share-alike. This project lives inside that boundary deliberately. It&rsquo;s built
              as a non-commercial accessibility tool, not a business, and that&rsquo;s a
              constraint I designed around rather than around.
            </p>
          </div>
          <figure className="lp-research__media">
            <img
              src="https://images.unsplash.com/photo-1551240903-154be3f2e18b?w=800&q=70"
              alt="A research workspace"
              loading="lazy"
            />
          </figure>
        </div>
      </Section>

      {/* 7. WHAT "IT WORKS" MEANS */}
      <NumberedSection
        id="metrics"
        bg="paper"
        num="04"
        tag="Being honest about metrics"
        heading="What &ldquo;it works&rdquo; actually means right now"
      >
        <p className="lp-body">
          The metrics I&rsquo;m tracking today — sync accuracy, generation reliability, session
          completion — prove the mechanics hold together. They don&rsquo;t yet prove the
          translation itself is comprehensible or trustworthy to someone who actually signs.
          That&rsquo;s a harder, more important number, and it&rsquo;s the one I&rsquo;d
          prioritize collecting next, not the one that&rsquo;s easiest to instrument.
        </p>
      </NumberedSection>

      {/* 8. WHAT IT LOOKS LIKE TODAY */}
      <NumberedSection
        id="product"
        bg="blue"
        num="05"
        tag="The product"
        heading="What it looks like today"
      >
        <p className="lp-body">
          Upload a video. Upload its transcript. Click Generate. Watch a sign-language
          interpretation appear alongside your video, broken into clickable moments — so
          you&rsquo;re not stuck watching start to finish, you can jump straight to the part you
          want to see signed again.
        </p>
        {/* TODO: If a screenshot or short screen-recording GIF of the app becomes available in
            project assets, embed it here inside a simple rounded, softly-shadowed frame, e.g.:
            <figure className="lp-app-shot">
              <img src="/assets/app-screenshot.png" alt="Sign Video Companion in use" />
            </figure> */}
      </NumberedSection>

      {/* 9. WHAT'S NEXT */}
      <NumberedSection
        id="next"
        bg="paper"
        num="06"
        tag="Looking ahead"
        heading="What&rsquo;s next"
      >
        <p className="lp-body">
          The honest next steps, in order: put this in front of Deaf and hard-of-hearing users
          and find out if it actually helps before adding anything else; support videos without
          existing captions; and decide — based on that feedback, not assumption — whether the
          current segment-by-segment interaction is the right shape at all, or just the fastest
          one to prototype.
        </p>
      </NumberedSection>

      {/* 10. FOOTER — dark closing moment */}
      <footer className="lp-footer">
        <div className="lp-footer__glow" aria-hidden="true" />
        <div className="lp-footer__inner lp-fade" data-fade>
          <h2 className="lp-footer__title">Try it now.</h2>
          <button type="button" className="lp-pill lp-pill--solid lp-pill--lg" onClick={goToApp}>
            Open Sign Video Companion →
          </button>
        </div>
        <div className="lp-footer__credits">
          <p>
            Sign language translation powered by{' '}
            <a href="https://rylo.com/sign/translate/" target="_blank" rel="noopener noreferrer">
              Rylo Translate
            </a>{' '}
            (sign.mt), by Amit Moryossef — CC BY-NC-SA 4.0. This is a non-commercial project.
          </p>
          <p>
            Photos via{' '}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
