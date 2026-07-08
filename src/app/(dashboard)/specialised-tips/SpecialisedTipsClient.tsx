"use client";

import React, { useState, useRef } from "react";
import {
  AlertTriangle,
  Mic,
  PenLine,
  BookOpen,
  Headphones,
  Volume2,
  Play,
  Pause,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Only one <TipAudioPlayer> should play at a time across the page.   */
/* Starting a new one stops and resets whichever was already playing. */
/* ------------------------------------------------------------------ */
let activeTipAudio: HTMLAudioElement | null = null;

/* ------------------------------------------------------------------ */
/* Inline audio player — exact steel-blue box used across the         */
/* listening/speaking exercise components, with a play/pause toggle.  */
/* ------------------------------------------------------------------ */
function TipAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "ended">("idle");
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (status === "playing") {
      el.pause();
      setStatus("paused");
      if (activeTipAudio === el) activeTipAudio = null;
    } else {
      if (activeTipAudio && activeTipAudio !== el) {
        activeTipAudio.pause();
        activeTipAudio.currentTime = 0;
      }
      activeTipAudio = el;
      el.volume = volume;
      el.play()
        .then(() => setStatus("playing"))
        .catch(() => setStatus("idle"));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex justify-center items-center py-4 select-none">
      <div className="w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 relative">
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            setCurrentTime(el.currentTime);
            if (el.duration) {
              setDuration(el.duration);
              setProgress((el.currentTime / el.duration) * 100);
            }
          }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={() => {
            setStatus("ended");
            setProgress(100);
          }}
          onPause={(e) => {
            if (e.currentTarget !== activeTipAudio) {
              setStatus("idle");
            }
          }}
        />

        {/* Play progress bar */}
        <div className="w-full h-[6px] bg-[#3B6C8A]/40 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-[#1C415A] transition-all duration-300 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Play/pause toggle + time */}
        <div className="flex items-center gap-2 px-1 mt-1">
          <button
            type="button"
            onClick={togglePlay}
            className="w-5 h-5 shrink-0 flex items-center justify-center text-white hover:opacity-80 transition"
            aria-label={status === "playing" ? "Pause" : "Play"}
          >
            {status === "playing" ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
          </button>
          <span className="text-white text-xs font-semibold tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
        </div>

        {/* Audio volume controls */}
        <div className="flex items-center justify-center gap-3 mb-1">
          <Volume2 className="w-5 h-5 text-white" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-48 h-[3px] bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
            style={{
              background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.3) ${
                volume * 100
              }%)`,
            }}
          />
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-vercel-card space-y-4">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="space-y-4 text-sm text-body leading-relaxed">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 list-disc pl-5 marker:text-mute">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}

function Quote({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-canvas-soft-2 p-4 rounded-lg border border-hairline space-y-1">
      {label && (
        <span className="text-2xs font-mono font-bold text-mute uppercase tracking-wider block">{label}</span>
      )}
      <p className="text-sm text-body leading-relaxed italic">{children}</p>
    </div>
  );
}

function Callout({
  icon: Icon,
  tint,
  title,
  children,
}: {
  icon: React.ElementType;
  tint: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-3.5 flex gap-3 items-start ${tint}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wide">{title}</p>
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Module tab configuration                                            */
/* ------------------------------------------------------------------ */
const MODULES = [
  { id: "speaking", label: "Speaking", icon: Mic, tint: "text-error-deep bg-error/10 border-error/20" },
  { id: "writing", label: "Writing", icon: PenLine, tint: "text-link-deep bg-link/10 border-link/20" },
  { id: "reading", label: "Reading", icon: BookOpen, tint: "text-warning-deep bg-warning/10 border-warning/20" },
  { id: "listening", label: "Listening", icon: Headphones, tint: "text-cyan-deep bg-cyan/15 border-cyan/25" },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

export default function SpecialisedTipsClient() {
  const [activeModule, setActiveModule] = useState<ModuleId>("speaking");

  return (
    <div className="space-y-6">
      {/* Important Note */}
      <Callout icon={AlertTriangle} tint="text-warning-deep bg-warning/10 border-warning/20" title="Important Note: Exam This Month Material">
        <p className="mb-2">
          The questions provided in the &ldquo;Exam This Month&rdquo; section are based on recent exam patterns and
          student feedback. These questions may appear in the exam, but remember that PTE can change the exact
          questions at any time.
        </p>
        <p className="mb-2">
          Even if PTE changes the questions, the exam will still follow the same format, patterns, and skills. All
          possible variations are already covered in our complete preparation material.
        </p>
        <p className="mb-2">
          Therefore, students should not depend only on this section. Make sure you practice the full material
          because it is designed to prepare you for any changes in the exam.
        </p>
        <p className="mb-2">
          During the final 1–2 days or the last week before your exam, you can focus more on the &ldquo;Exam This
          Month&rdquo; section for quick revision and confidence. However, your main preparation should always be
          based on the complete material provided.
        </p>
        <p className="font-semibold">
          Remember: Questions may change, but the skills and patterns remain the same. Complete preparation is the
          key to success.
        </p>
      </Callout>

      {/* Module tabs */}
      <div className="flex flex-wrap gap-2">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModule(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide border transition ${
                isActive
                  ? m.tint
                  : "text-mute bg-canvas border-hairline hover:bg-canvas-soft-2"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Module content */}
      <div className="space-y-4">
        {activeModule === "speaking" && <SpeakingSection />}
        {activeModule === "writing" && <WritingSection />}
        {activeModule === "reading" && <ReadingSection />}
        {activeModule === "listening" && <ListeningSection />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Speaking                                                             */
/* ------------------------------------------------------------------ */
function SpeakingSection() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <SectionCard title="Read Aloud — Keep Reading Without Stopping">
        <p>
          During the Read Aloud task, read the passage clearly and loudly so the microphone can capture your voice
          properly.
        </p>
        <p>
          The most important rule is do not stop while reading. If you come across a word that you cannot pronounce
          or find difficult, you can simply skip that word and continue reading. Do not pause, restart, or spend
          time trying to pronounce it.
        </p>
        <p>
          Skipping one or two difficult words is much better than breaking your fluency by stopping. Keep reading
          confidently and maintain a smooth flow until you reach the end of the passage.
        </p>

        <p className="font-semibold text-ink">Read Aloud – Example 1</p>
        <Quote label="Exam Question">
          A team of international researchers has uncovered a fascinating phenomenon: in response to rising global
          temperatures, Himalayan glaciers are actively working to preserve themselves by cooling the air in contact
          with their ice surface. However, it remains unclear how long these glaciers can continue to fight back
          against the effects of climate change.
        </Quote>

        <p className="font-semibold text-ink">Sample Audio</p>
        <p>
          Listen to the recorded response and observe the reading strategy. In this recording, some difficult words
          have been skipped intentionally to maintain fluency and pronunciation. For example, words such as
          &ldquo;fascinating phenomenon&rdquo; and &ldquo;glaciers&rdquo; were skipped in the audio instead of being
          read slowly or incorrectly. The reading continues smoothly without breaking the flow. The purpose of this
          example is to show that:
        </p>
        <TipAudioPlayer src="/tips-audio/read-aloud-sample.mp3" />
        <Bullets
          items={[
            "Do not stop while reading",
            "Do not restart after a mistake",
            "Skip difficult words if you cannot pronounce them clearly",
            "Continue reading confidently until the end",
          ]}
        />
        <p>Remember, maintaining smooth fluency is more important than stopping for one difficult word.</p>
      </SectionCard>

      <SectionCard title="Describe Image — Focus on Fluency, Not Content">
        <p>
          In the Describe Image task, do not focus on grammar. Your main goal is to keep speaking continuously
          without stopping.
        </p>
        <p>
          Even if your grammar is not perfect, keep talking. Do not pause to think about sentence structure or
          correct yourself.
        </p>
        <p>
          Also, avoid saying &ldquo;uh,&rdquo; &ldquo;um,&rdquo; &ldquo;aaa,&rdquo; or making other filler sounds
          while thinking. These interruptions can affect your fluency.
        </p>
        <p>
          The content of your response does not matter. The most important factors are pronunciation and fluency.
          You do not need to describe every detail of the image correctly. Instead, focus on speaking clearly and
          continuously.
        </p>

        <div className="space-y-3">
          <span className="text-2xs font-mono font-bold text-mute uppercase tracking-wider block">Example 1: Picture</span>
          <div className="rounded-lg overflow-hidden border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tips-images/describe-image-school-shopping.png"
              alt="Sample Describe Image picture: school shopping"
              className="w-full h-auto"
            />
          </div>
          <Quote label="Sample Answer">
            The picture gives information about school shopping. I can see a young girl and a woman in the picture. I
            can see the girl wearing a white shirt and carrying a pink school bag. I can also see pink, blue, and
            purple colors on the school bag. I can see many school supplies in the background. I can see shelves with
            different products. Moreover, I can see the woman helping the girl choose school items. I can see many
            colorful objects in the store. Furthermore, I can see a happy and friendly environment. I can also see
            different colors such as white, pink, blue, and purple. In addition, I can see shopping bags and school
            materials. Overall, the picture is very informative and provides useful information about school
            shopping.
          </Quote>
          <TipAudioPlayer src="/tips-audio/describe-image-example-1.mp3" />
        </div>

        <div className="space-y-3">
          <span className="text-2xs font-mono font-bold text-mute uppercase tracking-wider block">Example 2: Chart (Bar/Pie)</span>
          <div className="rounded-lg overflow-hidden border border-hairline bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tips-images/describe-image-rainfall-chart.png"
              alt="Sample Describe Image bar chart: average rainfall in inches"
              className="w-full h-auto"
            />
          </div>
          <Quote label="Sample Answer">
            The picture gives information about average rainfall in inches. I can see a bar graph with four different
            cities. I can see purple, pink, orange, and light blue bars. I can see New York has the highest rainfall.
            I can see Dallas has the second highest rainfall. I can see Phoenix has the lowest rainfall. I can also
            see Honolulu with medium rainfall. Moreover, I can see numbers above every bar. I can see different
            colors used to compare the cities. Furthermore, I can see the graph is simple and easy to understand. I
            can also see the names of different cities at the bottom. In addition, I can see the comparison of
            rainfall between different places. Overall, the picture is very informative and easy to understand.
          </Quote>
          <TipAudioPlayer src="/tips-audio/describe-image-example-2.mp3" />
        </div>

        <div className="space-y-3">
          <span className="text-2xs font-mono font-bold text-mute uppercase tracking-wider block">Example 3: Process</span>
          <div className="rounded-lg overflow-hidden border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tips-images/describe-image-coffee-process.png"
              alt="Sample Describe Image process diagram: coffee-making process"
              className="w-full h-auto"
            />
          </div>
          <Quote label="Sample Answer">
            The picture gives information about the coffee-making process. I can see a yellow background with a
            black circle in the middle. I can see coffee beans, coffee powder, cream, cups, and cooking pots. I can
            also see brown, white, yellow, and black colors. Moreover, I can see different steps of making coffee. I
            can see cream being added to the coffee. I can also see coffee powder being poured into the pot.
            Furthermore, I can see a cup of coffee at the end of the process. I can see different pictures connected
            together. In addition, I can see the complete process from the beginning to the final product. Overall,
            the picture is very informative and explains the coffee-making process clearly.
          </Quote>
          <TipAudioPlayer src="/tips-audio/describe-image-example-3.mp3" />
        </div>
      </SectionCard>

      <SectionCard title="Respond to a Situation — Focus on Fluency, Not the Perfect Answer">
        <p>
          In the Respond to a Situation task, do not worry about creating the perfect answer. The most important
          factors are pronunciation and fluency.
        </p>
        <p>
          A simple strategy is to turn the question into your response. Replace &ldquo;you&rdquo; with
          &ldquo;I&rdquo; or &ldquo;my friends and I&rdquo;, depending on the situation, and continue speaking
          naturally.
        </p>
        <p>
          If you finish your response before the timer ends, do not stop speaking. Start the response again by
          adding words such as &ldquo;Moreover,&rdquo; or &ldquo;Furthermore,&rdquo; and continue speaking until the
          recording stops.
        </p>
        <p>
          The goal is to keep speaking continuously without long pauses or filler sounds like &ldquo;uh,&rdquo;
          &ldquo;um,&rdquo; or &ldquo;aaa.&rdquo; Do not worry about grammar or giving the perfect response.
          Pronunciation and fluency are the most important factors.
        </p>
        <Quote label="Question">
          You and your friends went to a local restaurant where you encountered several issues with the quality and
          service. The long wait times, small meal portions, and the coffee you ordered never arrived. Now, the
          manager is asking for your feedback after the meal. How would you respond to that?
        </Quote>
        <Quote label="Sample Response">
          My friends and I went to a local restaurant where we encountered several issues with the quality and
          service. The wait times were very long, the meal portions were small, and the coffee we ordered never
          arrived. Now, the manager is asking for my feedback after the meal.
          <br />
          <br />
          Moreover, my friends and I went to a local restaurant where we encountered several issues with the quality
          and service. The wait times were very long, the meal portions were small, and the coffee we ordered never
          arrived. Now, the manager is asking for my feedback after the meal.
          <br />
          <br />
          Furthermore, my friends and I went to a local restaurant where we encountered several issues with the
          quality and service. The wait times were very long, the meal portions were small, and the coffee we
          ordered never arrived. Now, the manager is asking for my feedback after the meal.
        </Quote>
        <TipAudioPlayer src="/tips-audio/respond-to-situation.mp3" />
      </SectionCard>

      <SectionCard title="Repeat Sentence — Scoring Strategy">
        <p>
          If you are scoring above 70 on our platform, it means you are already at a level where you can achieve up
          to 90 in the exam. So do not worry about your current performance.
        </p>

        <p className="font-semibold text-ink">🎯 What Matters in This Task</p>
        <p>In Repeat Sentence, your score depends on:</p>
        <Bullets items={["Fluency", "Pronunciation", "Content"]} />
        <p>All three factors are important.</p>

        <p className="font-semibold text-ink">🧠 If You Forget Words</p>
        <Bullets
          items={[
            "If you forget some words from the audio, do not stop speaking.",
            "Just continue speaking and add simple words by yourself to keep going. The main goal is to maintain fluency and pronunciation, so you can still get marks.",
            "Even if the sentence is not fully correct, keep talking instead of staying silent.",
          ]}
        />

        <p className="font-semibold text-ink">⚠️ Important Balance</p>
        <Bullets
          items={[
            "Fluency and pronunciation are very important",
            "Content also matters",
            "But fluency should not break at any cost",
          ]}
        />

        <p className="font-semibold text-ink">💡 Final Strategy</p>
        <Bullets
          items={[
            "Speak continuously without stopping",
            "Do not panic if you miss words",
            "Keep your voice clear and confident",
            "Maintain fluency even if content is slightly incomplete",
          ]}
        />
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Writing                                                              */
/* ------------------------------------------------------------------ */
function WritingSection() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <SectionCard title="Summarize Written Text — The Easiest Strategy">
        <p>In the Summarize Written Text task, you must write only one sentence.</p>
        <p>The easiest strategy is to:</p>
        <Bullets
          items={[
            "Copy the first sentence from the passage.",
            "Add “, and” after it.",
            "Copy the last sentence from the passage.",
            "Start the second part with a lowercase letter, not a capital letter, because it is continuing the same sentence.",
          ]}
        />
        <p>There is no need to create your own summary. Simply combine the first and last sentences into one sentence using &ldquo;and.&rdquo;</p>
        <Quote label="Passage">
          Barr Green University has always led the way with the quality of its courses and teaching. One reason our
          programmes are so popular is because we understand the needs of students and society and are able to make
          changes when we see a way to improve our degrees. Therefore, we have decided that it is now time to update
          our business degree programme. We plan to reduce the number of financial courses that we offer in the
          Business programme in order to focus more on subjects such as management. Our aim is to create a
          world-class Business programme that covers the content that is so important to employers and companies. We
          are confident that our new Business degree will open many professional doors for our graduates. If
          you&rsquo;d like to know more about the course, click here.
        </Quote>
        <Quote label="Answer">
          Barr Green University has always led the way with the quality of its courses and teaching, and if
          you&rsquo;d like to know more about the course, click here.
        </Quote>
        <p className="font-semibold text-ink">
          Remember: Since this is one sentence, the first word after &ldquo;and&rdquo; should begin with a lowercase
          letter, unless it is a proper noun (such as a person&rsquo;s name, country, or company name).
        </p>
      </SectionCard>

      <SectionCard title="Email Writing — Memorization Strategy">
        <p>
          In Email Writing, there are only 14 prepared emails. In the exam, you will not get anything outside these
          14 emails.
        </p>
        <p>So you must memorize all email answers exactly as they are given.</p>
        <p>Do not try to create new answers in the exam. Just write the same memorized email.</p>
        <Callout icon={AlertTriangle} tint="text-error-deep bg-error/10 border-error/20" title="⚠️ Important Rule">
          There should be no mistakes in writing.
          <br />
          If mistakes happen, it should not be more than 2–3 small mistakes, because answers are already memorized.
        </Callout>
        <p className="font-semibold text-ink">🎯 Final Strategy</p>
        <Bullets
          items={[
            "Memorize all 14 emails",
            "Write exactly the same in the exam",
            "Do not change words or sentences",
            "Keep accuracy perfect",
          ]}
        />
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reading                                                              */
/* ------------------------------------------------------------------ */
function ReadingSection() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <SectionCard title="Multiple Choice, Choose Single Answer">
        <p>
          The Multiple Choice, Choose Single Answer questions carry very little weight in the overall exam. Since
          these questions can be time-consuming, you can skip them and spend your time on other question types that
          contribute more to your overall score.
        </p>
      </SectionCard>

      <SectionCard title="Multiple Choice, Choose Multiple Answers">
        <p>The Multiple Choice, Choose Multiple Answers questions can also be skipped.</p>
        <p>These questions have negative marking, which means:</p>
        <Bullets
          items={[
            "You receive marks for each correct answer you select.",
            "You lose marks for each incorrect answer you select.",
          ]}
        />
        <p>
          Because they are time-consuming and have negative marking, attempting them without confidence can reduce
          your overall score.
        </p>
        <p>
          Many students are still able to achieve a high score, even up to 90, by skipping both Multiple Choice
          question types and focusing their time on the other Reading tasks that carry more weight.
        </p>
        <Callout icon={AlertTriangle} tint="text-success bg-success/5 border-success/10" title="Tip">
          Save your time for the higher-weight Reading tasks and avoid losing marks through unnecessary guessing.
        </Callout>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Listening                                                            */
/* ------------------------------------------------------------------ */
function ListeningSection() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <SectionCard title="Summarize Spoken Text — Identify the Correct Answer">
        <p>For the Summarize Spoken Text task, you do not need to create your own summary.</p>
        <p>There are only a few Summarize Spoken Text questions, and all of their answers are included in this course.</p>
        <p>
          Your job is to listen carefully and identify which audio is being played. Once you recognize the topic,
          simply write the corresponding answer provided in the course.
        </p>
        <p>Some topics have more than one version. In these cases, listen for specific words or phrases to determine which answer to use.</p>

        <p className="font-semibold text-ink">Example</p>
        <p>
          If you hear the audio about Phone Interview and do not hear words or phrases such as &ldquo;robot&rdquo;
          or &ldquo;short pauses,&rdquo; write:
        </p>
        <Quote>
          Phone Interview 1 — In phone interviews, focus on tone, energy, confidence, and understanding the
          questions. Avoid rushing answers; take time to respond thoughtfully and clearly.
        </Quote>
        <p>
          However, if you hear words or phrases such as &ldquo;robot&rdquo; or &ldquo;short pauses,&rdquo; write:
        </p>
        <Quote>
          Phone Interview 2 — In a phone interview, the interviewer cannot see your facial expressions, so stay
          confident and avoid rushing your answers. Additionally, take short pauses and avoid speaking like a robot.
        </Quote>
        <p className="font-semibold text-ink">
          Tip: Listen carefully for the keywords in the audio. They will help you identify the correct answer to
          write.
        </p>

        <p className="font-semibold text-ink">🔑 How to Choose the Correct Answer</p>
        <p>There are two types of SST questions:</p>

        <p className="font-medium text-ink">1. Questions with Multiple Answers (Keyword-Based Selection)</p>
        <p>In these questions, there are two or more possible answers. You must listen for a specific keyword or phrase in the audio.</p>
        <p>Once you hear the keyword, simply write the matching answer.</p>
        <p className="font-medium">Example Patterns:</p>
        <Bullets
          items={[
            "If you hear a specific phrase → use Answer 1",
            "If you hear a different phrase → use Answer 2 or Answer 3",
          ]}
        />
        <p>You do not need to understand the full audio. Just focus on identifying the correct keyword.</p>

        <p className="font-semibold text-ink">Examples</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Quote label="Communication Skills">
            If you hear: &ldquo;failing to prepare well for interviews, which impacts chances of success&rdquo; →
            Write Communication Skills 1
            <br />
            If you hear: &ldquo;Many job seekers should focus on improving these skills&rdquo; → Write Communication
            Skills 2
          </Quote>
          <Quote label="Rail Pass / Train Pass">
            If you hear: &ldquo;$5 for sitting, $25 for sleeping&rdquo; → Write Answer 1
            <br />
            If you do NOT hear this phrase → Write Answer 2
          </Quote>
          <Quote label="Canadian Trade Market">
            If you hear: &ldquo;high earning potential without requiring any degree&rdquo; → Write Answer 1
            <br />
            If you hear: &ldquo;manufacture of everyday products&rdquo; → Write Answer 2
          </Quote>
          <Quote label="Wash Fruits and Vegetables">
            If you hear: &ldquo;Use water or brush for thicker skins&rdquo; → Write Answer 1
            <br />
            If you hear: &ldquo;Use cold water for vegetables, like potatoes&rdquo; → Write Answer 2
          </Quote>
          <Quote label="New Employees' Orientation">
            If you hear: &ldquo;overall company success&rdquo; → Write Answer 1
            <br />
            If you hear: &ldquo;what to do and what not to do&rdquo; → Write Answer 2
            <br />
            If you hear: &ldquo;interactive sessions makes them effective&rdquo; → Write Answer 3
          </Quote>
        </div>

        <p className="font-medium text-ink">2. Questions with Only One Answer</p>
        <p>Some SST questions have only one audio and one correct answer. In these cases:</p>
        <Bullets items={["You do not need to choose anything", "You simply write the full provided answer"]} />
        <p className="font-medium">Example Topics:</p>
        <Bullets items={["Children's School", "Job Interview", "Park Clean Up"]} />
        <p>Just identify the topic and write the single correct response from your material.</p>

        <Callout icon={AlertTriangle} tint="text-warning-deep bg-warning/10 border-warning/20" title="⚠️ Final Tip">
          Do not try to summarize or create your own answer. Your strategy is simple:
          <br />
          <br />
          <span className="font-semibold">Listen → Match keyword → Write the correct prepared answer</span>
          <br />
          <br />
          Focus only on correct matching, not understanding every word of the audio.
        </Callout>
      </SectionCard>

      <SectionCard title="Listening MCQs — Skip Strategy">
        <p>
          In the Listening Multiple Choice Questions, students should manage their time carefully, especially
          because WFD (Write From Dictation) requires more focus and time to score well.
        </p>
        <p className="font-semibold text-ink">Key Strategy</p>
        <p>If you are not confident about the answer or have not memorized it, it is better to skip these questions instead of wasting time.</p>
        <p className="font-semibold text-ink">Why Skip?</p>
        <Bullets
          items={[
            "WFD carries higher scoring value",
            "MCQs take extra time to read and think",
            "Wrong answers can reduce your score (especially in multiple answer questions)",
          ]}
        />
        <p className="font-semibold text-ink">What to Do Instead</p>
        <Bullets
          items={[
            "Skip MCQs if unsure",
            "Save time for WFD and high-scoring listening tasks",
            "Focus only on questions you are confident about",
          ]}
        />
        <Callout icon={AlertTriangle} tint="text-warning-deep bg-warning/10 border-warning/20" title="⚠️ Final Tip">
          Do not get stuck in MCQs. If you are not confident or do not remember the answer, skip and move on
          immediately to protect your time for WFD.
        </Callout>
      </SectionCard>

      <SectionCard title="Write From Dictation (WFD) — Most Important Writing Task">
        <p>
          The Write From Dictation (WFD) task is the most important task in the Writing module. It can have a major
          impact on your overall score, so it should be your main focus during preparation and in the exam.
        </p>
        <p className="font-semibold text-ink">🔑 Key Rules</p>
        <Bullets
          items={[
            "Always start with a capital letter",
            "Always end with a full stop (.)",
            "Do not add any unnecessary words",
            "Write exactly what you hear",
            "Focus completely on listening accuracy",
            "Do not change or rephrase the sentence",
            "Avoid any spelling mistakes (even small mistakes can affect your score)",
          ]}
        />
        <p className="font-semibold text-ink">🎯 Main Strategy</p>
        <p>In WFD, your goal is simple:</p>
        <p className="font-semibold">Listen carefully → Remember the sentence → Write exactly what you heard</p>
        <p>Do not try to improve the sentence or make it better. Do not add extra words or remove words. Just write it exactly as it is spoken.</p>
        <Callout icon={AlertTriangle} tint="text-error-deep bg-error/10 border-error/20" title="⚠️ Important Reminder">
          Even a single spelling mistake or missing word can reduce your score. So focus on:
        </Callout>
        <Bullets
          items={[
            "Accurate listening",
            "Correct spelling",
            "Perfect word order",
            "Proper capitalization and punctuation",
          ]}
        />
        <p className="font-semibold text-ink">💡 Final Tip</p>
        <p>
          WFD is all about perfect accuracy. No creativity, no changes—only exact writing from listening. This is
          one of the highest scoring tasks, so give it full attention.
        </p>
      </SectionCard>
    </div>
  );
}
