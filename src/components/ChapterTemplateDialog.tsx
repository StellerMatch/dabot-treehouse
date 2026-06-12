import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import compassAsset from "@/assets/compass-stag.png.asset.json";
import demoGuideAsset from "@/assets/trunk-green-guide-cutout.png.asset.json";
import echoAsset from "@/assets/echo-presenting.png.asset.json";
import ledgerAsset from "@/assets/ledger-presenting.png.asset.json";
import shieldAsset from "@/assets/shield-presenting.png.asset.json";
import {
  TREEHOUSE_CHAPTER_TEMPLATES,
  chapterTemplateById,
  primaryChapterGuideName,
  type TreehouseChapterTemplate,
} from "@/lib/treehouse-chapter-templates";

type ChapterTemplateDialogProps = {
  ideaId?: string;
  ideaTitle?: string;
  chapterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDemoComplete?: (chapterId: string) => void;
};

type RootRoomRunStatus = "idle" | "running" | "complete";

const ROOT_ROOM_STORY_STEPS = ["Echo", "Shield", "Ledger", "Chief"];

export function ChapterTemplateDialog({
  ideaId,
  ideaTitle,
  chapterId,
  open,
  onOpenChange,
  onDemoComplete,
}: ChapterTemplateDialogProps) {
  const chapter = chapterTemplateById(chapterId) ?? TREEHOUSE_CHAPTER_TEMPLATES[0];
  const ideaKey = useMemo(() => ideaId || ideaTitle || "untitled", [ideaId, ideaTitle]);
  const demoStorageKey = useMemo(() => {
    return `dabottree:chapter-demo:${ideaKey}:${chapter.id}`;
  }, [chapter.id, ideaKey]);
  const rootRoomRunStorageKey = useMemo(() => {
    return `dabottree:chapter-run-demo:${ideaKey}:${chapter.id}`;
  }, [chapter.id, ideaKey]);
  const [demoComplete, setDemoComplete] = useState(false);
  const [rootRoomRunStatus, setRootRoomRunStatus] = useState<RootRoomRunStatus>("idle");
  const [rootRoomRunStep, setRootRoomRunStep] = useState(0);
  const isRootRoomChapter = chapter.id === "root-room";

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setDemoComplete(window.localStorage.getItem(demoStorageKey) === "complete");
    if (!isRootRoomChapter) {
      setRootRoomRunStatus("idle");
      setRootRoomRunStep(0);
      return;
    }
    const storedRunStatus = window.localStorage.getItem(rootRoomRunStorageKey);
    setRootRoomRunStatus(storedRunStatus === "complete" ? "complete" : "idle");
    setRootRoomRunStep(storedRunStatus === "complete" ? ROOT_ROOM_STORY_STEPS.length - 1 : 0);
  }, [demoStorageKey, isRootRoomChapter, open, rootRoomRunStorageKey]);

  const markDemoComplete = () => {
    setDemoComplete(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(demoStorageKey, "complete");
    }
    onDemoComplete?.(chapter.id);
  };

  const startRootRoomRun = () => {
    if (!isRootRoomChapter || rootRoomRunStatus === "running" || demoComplete) return;

    setRootRoomRunStatus("running");
    setRootRoomRunStep(0);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(rootRoomRunStorageKey, "running");
    }

    ROOT_ROOM_STORY_STEPS.forEach((_, index) => {
      window.setTimeout(
        () => {
          setRootRoomRunStep(index);
        },
        450 * (index + 1),
      );
    });

    window.setTimeout(
      () => {
        setRootRoomRunStatus("complete");
        setRootRoomRunStep(ROOT_ROOM_STORY_STEPS.length - 1);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(rootRoomRunStorageKey, "complete");
        }

        window.setTimeout(() => {
          markDemoComplete();
        }, 650);
      },
      450 * (ROOT_ROOM_STORY_STEPS.length + 1),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden border-amber-900/35 bg-[#f3dfb4] p-0 text-amber-950">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(circle at 24% 20%, rgba(255,245,205,0.8), transparent 32%), linear-gradient(135deg, rgba(96,54,19,0.18), transparent 44%, rgba(58,31,12,0.24))",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(rgba(112,68,24,0.22) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <div className="relative grid max-h-[85vh] overflow-y-auto md:grid-cols-[240px_1fr]">
            <DemoGuidePanel
              chapter={chapter}
              demoComplete={demoComplete}
              onDemoComplete={markDemoComplete}
            />
            <ChapterTemplateBody
              ideaTitle={ideaTitle}
              chapter={chapter}
              demoComplete={demoComplete}
              onDemoComplete={markDemoComplete}
              rootRoomRunStatus={rootRoomRunStatus}
              rootRoomRunStep={rootRoomRunStep}
              onStartRootRoomRun={startRootRoomRun}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const guideAssets: Record<string, string> = {
  Compass: compassAsset.url,
  Echo: echoAsset.url,
  Ledger: ledgerAsset.url,
  Shield: shieldAsset.url,
};

function DemoGuidePanel({
  chapter,
  demoComplete,
  onDemoComplete,
}: {
  chapter: TreehouseChapterTemplate;
  demoComplete: boolean;
  onDemoComplete: () => void;
}) {
  const guideName = primaryChapterGuideName(chapter);
  const guideAsset = guideAssets[guideName] ?? demoGuideAsset.url;

  return (
    <aside className="relative min-h-72 overflow-hidden border-b border-amber-900/25 bg-gradient-to-b from-[#6b421f] via-[#3f2513] to-[#1f1209] p-5 text-amber-50 md:border-b-0 md:border-r">
      <div
        aria-hidden
        className="absolute inset-x-8 bottom-8 h-32 rounded-full bg-amber-200/20 blur-3xl"
      />
      <div className="relative flex h-full flex-col items-center justify-end gap-3">
        <div className="rounded-full border border-amber-100/35 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm backdrop-blur-sm">
          {guideName}
        </div>
        <img
          src={guideAsset}
          alt=""
          className="max-h-56 w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]"
          draggable={false}
        />
        <div className="rounded-sm border border-amber-100/35 bg-amber-100/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-50/90">
          Demo
        </div>
        <button
          type="button"
          onClick={onDemoComplete}
          disabled={demoComplete}
          className="rounded-sm border border-amber-100/45 bg-amber-100/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm transition hover:bg-amber-100/30 disabled:cursor-default disabled:bg-emerald-900/45"
        >
          {demoComplete ? "Complete" : "Demo Complete"}
        </button>
      </div>
    </aside>
  );
}

function ChapterTemplateBody({
  ideaTitle,
  chapter,
  demoComplete,
  onDemoComplete,
  rootRoomRunStatus,
  rootRoomRunStep,
  onStartRootRoomRun,
}: {
  ideaTitle?: string;
  chapter: TreehouseChapterTemplate;
  demoComplete: boolean;
  onDemoComplete: () => void;
  rootRoomRunStatus: RootRoomRunStatus;
  rootRoomRunStep: number;
  onStartRootRoomRun: () => void;
}) {
  const isRootRoomChapter = chapter.id === "root-room";

  return (
    <section className="relative p-5 sm:p-6">
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-fit rounded-full border border-amber-900/25 bg-amber-100/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900/75">
            Empty chapter template
          </div>
          <div className="w-fit rounded-full border border-amber-900/20 bg-amber-950/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900/70">
            Future-ready shell
          </div>
          <button
            type="button"
            onClick={onDemoComplete}
            disabled={demoComplete}
            className="w-fit rounded-sm border border-amber-900/35 bg-amber-950/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-950 transition hover:bg-amber-950/15 disabled:border-emerald-900/35 disabled:bg-emerald-900/15 disabled:text-emerald-950"
          >
            {demoComplete ? "Complete" : "Demo"}
          </button>
        </div>
        <DialogTitle className="font-serif text-2xl text-amber-950">
          Chapter {chapter.chapter}: {chapter.title}
        </DialogTitle>
        <DialogDescription className="font-serif text-sm leading-relaxed text-amber-900/75">
          {chapter.purpose}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-amber-900/25 bg-amber-50/60 p-4 shadow-inner">
          <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
            Project
          </div>
          <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-amber-950">
            {ideaTitle || "Untitled idea"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/75">
            This is the empty working room for the chapter. Add the real questions, lane notes, and
            output when this chapter is ready.
          </p>
        </div>

        <div className="rounded-md border border-amber-900/20 bg-amber-100/45 p-4">
          <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
            Chapter status
          </div>
          <div className="mt-2 rounded-sm border border-amber-900/20 bg-amber-50/55 px-3 py-2 font-serif text-sm font-semibold text-amber-950">
            {demoComplete ? "Demo marked complete" : "Blank template ready"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-950/70">
            {demoComplete
              ? "This is a local demo state only. No n8n workflow has run."
              : "No live workflow is attached yet."}
          </p>
        </div>
      </div>

      {isRootRoomChapter ? (
        <RootRoomRunPanel
          status={rootRoomRunStatus}
          activeStep={rootRoomRunStep}
          demoComplete={demoComplete}
          onStart={onStartRootRoomRun}
        />
      ) : null}

      <div className="mt-4">
        <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
          Work slots
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {chapter.parts.map((label) => (
            <div key={label} className="rounded-sm border border-amber-900/25 bg-amber-100/45 p-3">
              <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
                Empty slot
              </div>
              <div className="mt-0.5 font-serif text-sm font-semibold text-amber-950">{label}</div>
              <div className="mt-2 min-h-12 rounded-sm border border-dashed border-amber-900/25 bg-amber-50/35 p-2 text-xs leading-relaxed text-amber-950/60">
                Add this lane's prompt, notes, output, or handoff here.
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TemplatePanel title="Starter Notes">
          <TemplateLine label="What this chapter needs" />
          <TemplateLine label="What is still missing" />
          <TemplateLine label="What Boss should decide later" />
        </TemplatePanel>
        <TemplatePanel title="Exit Check">
          {chapter.checkpoints.map((checkpoint) => (
            <TemplateCheck key={checkpoint} label={checkpoint} />
          ))}
        </TemplatePanel>
      </div>

      <div className="mt-4 rounded-md border border-amber-900/25 bg-amber-950/10 p-3">
        <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
          Boundary
        </div>
        <p className="mt-1 text-xs leading-relaxed text-amber-950/75">{chapter.boundary}</p>
      </div>

      <div className="mt-4 rounded-md border border-amber-900/20 bg-amber-950/10 p-3">
        <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
          Future chapter shells
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TREEHOUSE_CHAPTER_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`rounded-sm border px-2.5 py-2 font-serif text-[11px] ${
                template.id === chapter.id
                  ? "border-amber-900/50 bg-amber-100/65 text-amber-950"
                  : "border-amber-900/20 bg-amber-50/35 text-amber-900/70"
              }`}
            >
              Chapter {template.chapter}: {template.title}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RootRoomRunPanel({
  status,
  activeStep,
  demoComplete,
  onStart,
}: {
  status: RootRoomRunStatus;
  activeStep: number;
  demoComplete: boolean;
  onStart: () => void;
}) {
  const statusLabel =
    status === "complete" || demoComplete ? "Complete" : status === "running" ? "Running" : "Ready";
  const statusDetail =
    status === "complete" || demoComplete
      ? "Fake Root Room run complete. This can move the idea to Chapter 3."
      : status === "running"
        ? "Steward is running the local Root Room test sequence."
        : "Local fake Go test only. No n8n workflow will run.";

  return (
    <div className="mt-4 rounded-md border border-cyan-900/25 bg-cyan-50/50 p-4 shadow-inner">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-cyan-950/60">
            Root Room Go test
          </div>
          <div className="mt-1 font-serif text-lg font-semibold text-cyan-950">
            Steward starts the local Root Room run
          </div>
          <p className="mt-1 text-xs leading-relaxed text-cyan-950/70">{statusDetail}</p>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={status === "running" || demoComplete}
          className="rounded-sm border border-cyan-900/30 bg-cyan-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-50 shadow-sm transition hover:bg-cyan-900 disabled:cursor-default disabled:border-emerald-900/30 disabled:bg-emerald-800"
        >
          {status === "running"
            ? "Running"
            : status === "complete" || demoComplete
              ? "Complete"
              : "Go"}
        </button>
      </div>

      <div className="mt-3 rounded-sm border border-cyan-900/20 bg-white/50 px-3 py-2 font-serif text-sm font-semibold text-cyan-950">
        Status: {statusLabel}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {ROOT_ROOM_STORY_STEPS.map((step, index) => {
          const reached =
            status === "complete" || demoComplete || (status === "running" && index <= activeStep);
          return (
            <div
              key={step}
              className={`rounded-sm border px-2.5 py-2 text-center font-serif text-xs font-semibold ${
                reached
                  ? "border-emerald-900/35 bg-emerald-100/70 text-emerald-950"
                  : "border-cyan-900/15 bg-cyan-100/45 text-cyan-950/55"
              }`}
            >
              {step}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-cyan-950/65">
        Test path: Go -&gt; Steward -&gt; fake Root Room module -&gt; Echo / Shield / Ledger / Chief
        -&gt; Complete. No live n8n, bot route, credential, or external action fires.
      </p>
    </div>
  );
}

function TemplatePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-amber-900/20 bg-amber-50/45 p-3">
      <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
        {title}
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function TemplateLine({ label }: { label: string }) {
  return (
    <div className="rounded-sm border border-dashed border-amber-900/25 bg-amber-100/35 px-3 py-2 text-xs leading-relaxed text-amber-950/65">
      {label}
    </div>
  );
}

function TemplateCheck({ label }: { label: string }) {
  return (
    <div className="flex gap-2 rounded-sm border border-amber-900/20 bg-amber-100/35 px-3 py-2 text-xs leading-relaxed text-amber-950/75">
      <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border border-amber-900/35 bg-amber-50/60" />
      <span>{label}</span>
    </div>
  );
}
