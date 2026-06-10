import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";

type Profile = {
  authed: boolean;
  name: string;
  email: string;
  photo: string;
};

function readProfile(): Profile {
  if (typeof window === "undefined") {
    return { authed: false, name: "", email: "", photo: "" };
  }
  try {
    return {
      authed: localStorage.getItem("dabottree:authed") === "1",
      name: localStorage.getItem("dabottree.profile.name") ?? "",
      email: localStorage.getItem("dabottree:accountEmail") ?? "",
      photo: localStorage.getItem("dabottree.profile.photo") ?? "",
    };
  } catch {
    return { authed: false, name: "", email: "", photo: "" };
  }
}

export function AccountBadge() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profile, setProfile] = useState<Profile>(() => readProfile());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Re-read on route change & on storage events.
  useEffect(() => {
    setProfile(readProfile());
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onStorage = () => setProfile(readProfile());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Hide on the signin page itself.
  if (pathname.startsWith("/signin")) return null;

  if (!profile.authed) {
    return (
      <div className="fixed right-3 top-3 z-[60] sm:right-5 sm:top-5">
        <Link
          to="/signin"
          search={{ next: pathname }}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-[rgba(24,13,7,0.7)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-50 shadow-sm backdrop-blur-md transition hover:bg-[rgba(40,22,10,0.85)]"
        >
          <UserIcon className="h-3.5 w-3.5" />
          Sign in
        </Link>
      </div>
    );
  }

  const displayName = profile.name || profile.email || "You";
  const initial = (profile.name || profile.email || "?").trim().charAt(0).toUpperCase();

  const signOut = () => {
    try {
      localStorage.removeItem("dabottree:authed");
    } catch {}
    setProfile(readProfile());
    setOpen(false);
    router.navigate({ to: "/" });
  };

  return (
    <div ref={wrapRef} className="fixed right-3 top-3 z-[60] sm:right-5 sm:top-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={displayName}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-amber-200/40 bg-gradient-to-b from-[#a8763d] to-[#5c4421] text-sm font-semibold text-amber-50 shadow-md backdrop-blur-md transition hover:from-[#b78449] hover:to-[#6b5128]"
      >
        {profile.photo ? (
          <img src={profile.photo} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-md border border-amber-200/30 bg-[rgba(24,13,7,0.95)] text-amber-50 shadow-xl backdrop-blur-md">
          <div className="border-b border-amber-200/20 px-3 py-2">
            <div className="truncate text-[12px] font-semibold">{displayName}</div>
            {profile.email && profile.email !== displayName && (
              <div className="truncate text-[10px] text-amber-100/60">{profile.email}</div>
            )}
          </div>
          <Link
            to="/signin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-amber-200/10"
          >
            <UserIcon className="h-3.5 w-3.5" />
            Profile
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-red-100 hover:bg-red-500/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
