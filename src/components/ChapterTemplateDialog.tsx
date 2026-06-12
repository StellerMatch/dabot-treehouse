import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import demoGuideAsset from "@/assets/trunk-green-guide-cutout.png.asset.json";
import {
  TREEHOUSE_CHAPTER_TEMPLATES,
  chapterTemplateById,
  type TreehouseChapterTemplate,
} from "@/lib/treehouse-chapter-templates";

type ChapterTemplateDialogProps = {
  ideaTitle?: string;
  chapterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChapterTemplateDialog({
  ideaTitle,
  chapterId,
  open,
  onOpenChange,
}: ChapterTemplateDialogProps) {
  const chapter = chapterTemplateById(chapterId) ?? TREEHOUSE_CHAPTER_TEMPLATES[0];

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
            <DemoGuidePanel />
            <ChapterTemplateBody ideaTitle={ideaTitle} chapter={chapter} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DemoGuidePanel() {
  return (
    <aside className="relative min-h-72 overflow-hidden border-b border-amber-900/25 bg-gradient-to-b from-[#6b421f] via-[#3f2513] to-[#1f1209] p-5 text-amber-50 md:border-b-0 md:border-r">
      <div
        aria-hidden
        className="absolute inset-x-8 bottom-8 h-32 rounded-full bg-amber-200/20 blur-3xl"
      />
      <div className="relative flex h-full flex-col items-center justify-end gap-3">
        <div className="rounded-full border border-amber-100/35 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm backdrop-blur-sm">
          Demo Guide
        </div>
        <img
          src={demoGuideAsset.url}
          alt=""
          className="max-h-56 w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]"
          draggable={false}
        />
        <div className="rounded-sm border border-amber-100/35 bg-amber-100/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-50/90">
          Demo
        </div>
      </div>
    </aside>
  );
}

function ChapterTemplateBody({
  ideaTitle,
  chapter,
}: {
  ideaTitle?: string;
  chapter: TreehouseChapterTemplate;
}) {
  return (
    <section className="relative p-5 sm:p-6">
      <DialogHeader>
        <div className="mb-2 w-fit rounded-full border border-amber-900/25 bg-amber-100/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900/75">
          Empty chapter template
        </div>
        <DialogTitle className="font-serif text-2xl text-amber-950">
          Chapter {chapter.chapter}: {chapter.title}
        </DialogTitle>
        <DialogDescription className="font-serif text-sm leading-relaxed text-amber-900/75">
          A clean starter shell for this chapter. No real questions or bot flows have been added
          yet.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 rounded-md border border-amber-900/25 bg-amber-50/60 p-4 shadow-inner">
        <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
          Project
        </div>
        <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-amber-950">
          {ideaTitle || "Untitled idea"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/75">
          Template ready. Add the chapter content here when this part of the Treehouse flow is
          ready.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {chapter.parts.map((label) => (
          <div
            key={label}
            className="rounded-sm border border-amber-900/25 bg-amber-100/45 px-3 py-2"
          >
            <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
              Placeholder
            </div>
            <div className="mt-0.5 font-serif text-sm font-semibold text-amber-950">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-md border border-amber-900/20 bg-amber-950/10 p-3">
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
