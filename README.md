# Sign Video Companion

**A sign-language companion for the videos that would otherwise have none.**

Upload a local video and its transcript, and Sign Video Companion generates a sign-language interpretation that plays alongside it — synced, segment by segment, so you can watch straight through or jump to any moment you want replayed.

> This is an early-stage portfolio/demo project, not a finished product. See [Where this stands](#where-this-stands) below.

---

## What it does

1. You upload a local video file (`.mp4`/`.webm`) and its timestamped transcript (`.txt`).
2. Each line of the transcript is translated into a signed pose sequence.
3. A sync engine maps every signed segment to its exact place in the video's timeline — stretched or compressed so it never runs ahead of or behind the video.
4. You watch the video and the signing avatar side by side, with a clickable transcript list below so you can jump to and replay any individual moment.

## How it works

```
Video + transcript.txt
        │
        ▼
Transcript parsed into timestamped segments
        │
        ▼
Each segment translated into a signed pose sequence
   (via Rylo Translate's hosted API — see Attribution below)
        │
        ▼
Sync engine maps each segment to the video's timeline
        │
        ▼
Video + avatar play in sync, segment-by-segment, clickable
```

## Tech stack

- **React + Vite**, Tailwind CSS
- **Translation**: [Rylo Translate](https://rylo.com/sign/translate/) (sign.mt)'s hosted spoken-text-to-signed-pose API
- **Avatar rendering**: [`pose-viewer`](https://www.npmjs.com/package/pose-viewer), a framework-agnostic web component for playing `.pose` files
- Deployed on Vercel

## Getting started

```bash
git clone https://github.com/nhatanh2212/sign-video-companion.git
cd sign-video-companion
npm install
npm run dev
```

Then open the app, upload a short video and a matching transcript (see format below), and click **Generate translations**.

### Transcript format

Plain `.txt`, one phrase per line, timestamp first:

```
0:00 Hi everyone, welcome back to the channel.
0:02 Today we're going to talk about accessibility.
0:05 Specifically, how sign language translation works.
```

## Where this stands

I want to be direct about this project's current state, not just what it does:

- **This is a hypothesis, not a validated need.** I built this because the gap between captions and sign language seemed real and worth testing — I have not yet had this in front of Deaf or hard-of-hearing users to confirm it solves a problem they actually feel. That's the next real step, not a footnote.
- **This does not replace human interpretation.** Current AI-generated signing lacks the facial grammar, pacing, and regional nuance that real sign languages carry, and a bad automated translation can be worse than none — it can look authoritative while getting the nuance wrong. This project is positioned as coverage for content that would otherwise get zero signed interpretation (personal videos, niche clips), not as competition for professional interpreters where they're available.
- **The metrics tracked today — sync accuracy, generation reliability, session completion — prove the mechanics hold together.** They don't yet prove the translation itself is comprehensible or trustworthy to someone who actually signs. That's the harder, more important number, and the one I'd prioritize collecting next.

## Roadmap

- [ ] Validate with actual Deaf/hard-of-hearing users
- [ ] Support videos without existing captions (ASR fallback)
- [ ] Support additional sign languages beyond ASL
- [ ] Decide, based on real feedback, whether segment-by-segment interaction is the right shape at all

## Attribution

Sign language translation is powered by open research and tooling from **[Rylo Translate](https://rylo.com/sign/translate/)** (sign.mt), created by **Amit Moryossef**:

```
@misc{moryossef2023signmt,
    title={Rylo Translate: Effortless Real-Time Sign Language Translation},
    author={Moryossef, Amit},
    howpublished={\url{https://rylo.com/sign/translate/}},
    year={2023}
}
```

Licensed **CC BY-NC-SA 4.0** — non-commercial, share-alike, attribution required. This project lives inside that boundary deliberately: it's built as a non-commercial accessibility project, not a business.

Photography via [Unsplash](https://unsplash.com).

## License

This project's own code is available for non-commercial use, consistent with the CC BY-NC-SA 4.0 terms of the translation research it depends on. See [Rylo Translate's license](https://rylo.com/sign/translate/) for full terms.
