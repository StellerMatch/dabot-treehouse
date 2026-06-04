import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DaBotTree Builder" },
      { name: "description", content: "Build intelligent bot conversation trees with ease." },
      { property: "og:title", content: "DaBotTree Builder" },
      { property: "og:description", content: "Build intelligent bot conversation trees with ease." },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#fcfbf8" }}
    >
      <img
        data-lovable-blank-page-placeholder="REMOVE_THIS"
        src="https://cdn.gpteng.co/blank-app-v1.svg"
        alt="Your app will live here!"
      />
    </div>
  );
}
