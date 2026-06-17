import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handleTreehouseChapterActivity(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/treehouse/chapter-activity") return null;

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const requiredToken = process.env.TREEHOUSE_CHAPTER_ACTIVITY_TOKEN?.trim();
  if (requiredToken) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${requiredToken}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const body = (await request.json().catch(() => null)) as {
    answers?: Array<{ questionId: string; answer: string }>;
    currentChapterId?: string | null;
    message?: string | null;
    nextChapterId?: string | null;
    projectId?: string;
    question?: string | null;
    questions?: Array<{
      id: string;
      prompt: string;
      reason?: string | null;
      answerType?: string | null;
    }>;
    source?: string;
    status?: string;
  } | null;
  if (
    !body?.projectId ||
    !body.status ||
    !["bots_running", "needs_question", "next_ready"].includes(body.status)
  ) {
    return new Response(JSON.stringify({ error: "Invalid chapter activity payload" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const status = body.status as "bots_running" | "needs_question" | "next_ready";

  const { writeTreehouseChapterActivity } = await import(
    "./lib/treehouse-chapter-activity.server"
  );
  const activity = await writeTreehouseChapterActivity({
    answers: Array.isArray(body.answers) ? body.answers : undefined,
    currentChapterId: body.currentChapterId ?? null,
    message: body.message ?? null,
    nextChapterId: body.nextChapterId ?? null,
    projectId: body.projectId,
    question: body.question ?? null,
    questions: Array.isArray(body.questions) ? body.questions : undefined,
    source: body.source ?? "treehouse-chapter-activity-api",
    status,
  });

  return new Response(JSON.stringify({ activity, ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const chapterActivityResponse = await handleTreehouseChapterActivity(request);
      if (chapterActivityResponse) return chapterActivityResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
