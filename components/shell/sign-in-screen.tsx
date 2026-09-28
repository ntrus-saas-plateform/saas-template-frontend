"use client";

import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";
import { t } from "@/lib/i18n/messages";
import { usePreferences } from "@/providers/preferences-provider";

type SignInScreenProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  footnote?: string;
  alert?: string | null;
  /** When set, renders the reference login form and calls this on submit / social. */
  onLogin?: () => void | Promise<void>;
};

/** Paths from corner nodes → card edge, then a shared Edge loop where flows meet. */
const PATHS = {
  tl: "M104 68 H240 V150 H420 V250 H500 V310",
  tr: "M1096 68 H960 V150 H780 V250 H700 V310",
  bl: "M104 732 H240 V650 H420 V550 H500 V490",
  br: "M1096 732 H960 V650 H780 V550 H700 V490",
  /** Rounded rectangle around the login card — energy circulates here */
  edge:
    "M500 310 H700 Q760 310 760 370 V430 Q760 490 700 490 H500 Q440 490 440 430 V370 Q440 310 500 310 Z",
} as const;

function EnergyParticle({
  path,
  delay,
  duration,
}: {
  path: string;
  delay: string;
  duration: string;
}) {
  return (
    <circle r="3.2" className="signin-dark__particle">
      <animateMotion
        dur={duration}
        begin={delay}
        repeatCount="indefinite"
        path={path}
        rotate="auto"
        keyPoints="0;1"
        keyTimes="0;1"
        calcMode="linear"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0.35"
        keyTimes="0;0.08;0.85;1"
        dur={duration}
        begin={delay}
        repeatCount="indefinite"
      />
    </circle>
  );
}

function CircuitBackdrop() {
  return (
    <svg
      className="signin-dark__circuit"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <filter id="signinEnergyGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="signinEnergyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="45%" stopColor="#60a5fa" stopOpacity="1" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Corner nodes */}
      <g className="signin-dark__node-group signin-dark__node-group--tl">
        <rect x="48" y="48" width="56" height="40" rx="4" className="signin-dark__node" />
        <circle cx="104" cy="68" r="2.5" className="signin-dark__dot" />
      </g>
      <g className="signin-dark__node-group signin-dark__node-group--tr">
        <rect x="1096" y="48" width="56" height="40" rx="4" className="signin-dark__node" />
        <circle cx="1096" cy="68" r="2.5" className="signin-dark__dot" />
      </g>
      <g className="signin-dark__node-group signin-dark__node-group--bl">
        <rect x="48" y="712" width="56" height="40" rx="4" className="signin-dark__node" />
        <circle cx="104" cy="732" r="2.5" className="signin-dark__dot" />
      </g>
      <g className="signin-dark__node-group signin-dark__node-group--br">
        <rect x="1096" y="712" width="56" height="40" rx="4" className="signin-dark__node" />
        <circle cx="1096" cy="732" r="2.5" className="signin-dark__dot" />
      </g>

      {/* Base traces */}
      <path d={PATHS.tl} className="signin-dark__trace" />
      <path d={PATHS.tr} className="signin-dark__trace" />
      <path d={PATHS.bl} className="signin-dark__trace" />
      <path d={PATHS.br} className="signin-dark__trace" />
      <path d={PATHS.edge} className="signin-dark__trace signin-dark__trace--edge" />

      {/* Energy pulses along feeds */}
      <path d={PATHS.tl} className="signin-dark__energy signin-dark__energy--a" pathLength={100} />
      <path d={PATHS.tr} className="signin-dark__energy signin-dark__energy--b" pathLength={100} />
      <path d={PATHS.bl} className="signin-dark__energy signin-dark__energy--c" pathLength={100} />
      <path d={PATHS.br} className="signin-dark__energy signin-dark__energy--d" pathLength={100} />
      <path
        d={PATHS.edge}
        className="signin-dark__energy signin-dark__energy--edge"
        pathLength={100}
      />

      {/* Particles racing to the Edge, then orbiting */}
      <g filter="url(#signinEnergyGlow)">
        <EnergyParticle path={PATHS.tl} duration="2.8s" delay="0s" />
        <EnergyParticle path={PATHS.tr} duration="2.8s" delay="0.7s" />
        <EnergyParticle path={PATHS.bl} duration="2.8s" delay="1.4s" />
        <EnergyParticle path={PATHS.br} duration="2.8s" delay="2.1s" />
        <EnergyParticle path={PATHS.edge} duration="5.5s" delay="0s" />
        <EnergyParticle path={PATHS.edge} duration="5.5s" delay="2.75s" />
      </g>

      {/* Meeting points on the Edge */}
      <circle cx="500" cy="310" r="3" className="signin-dark__junction" />
      <circle cx="700" cy="310" r="3" className="signin-dark__junction signin-dark__junction--delay" />
      <circle cx="500" cy="490" r="3" className="signin-dark__junction signin-dark__junction--delay2" />
      <circle cx="700" cy="490" r="3" className="signin-dark__junction signin-dark__junction--delay3" />
    </svg>
  );
}

function BrandRing() {
  return (
    <div className="signin-dark__ring" aria-hidden>
      <svg viewBox="0 0 64 64" className="signin-dark__ring-svg">
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="url(#signinRingGlow)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="40 100"
          transform="rotate(-95 32 32)"
        />
        <defs>
          <linearGradient id="signinRingGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="45%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Dark circuit login — SSO entry (Keycloak). No local credentials / social.
 */
export function SignInScreen({
  title,
  description,
  action,
  footnote,
  alert,
  onLogin,
}: SignInScreenProps) {
  const { locale } = usePreferences();
  const [pending, setPending] = useState(false);

  const isLoginForm = typeof onLogin === "function" && !action;

  async function startLogin() {
    if (!onLogin || pending) return;
    setPending(true);
    try {
      await onLogin();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="signin-dark relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <CircuitBackdrop />

      <main id="main-content" className="signin-dark__card relative z-10 w-full max-w-[420px] px-8 py-9 sm:px-10 sm:py-10">
        <BrandRing />

        {isLoginForm ? (
          <div className="mt-5 text-center">
            <h1 className="signin-dark__title">
              {t(locale, "auth.welcomeBack")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
              {t(locale, "auth.signInDescription")}
            </p>

            {alert ? (
              <p role="alert" className="mt-4 text-sm text-[#fbbf24]">
                {alert}
              </p>
            ) : null}

            <Button
              type="button"
              variant="default"
              disabled={pending}
              className="signin-dark__login mt-8 w-full"
              onClick={() => void startLogin()}
            >
              {pending ? "…" : t(locale, "auth.login")}
            </Button>
          </div>
        ) : (
          <div className="mt-5 text-center">
            <h1 className="signin-dark__title">
              {title ?? t(locale, "auth.welcomeBack")}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-relaxed text-[#9ca3af]">
                {description}
              </p>
            ) : null}
            {alert ? (
              <p role="alert" className="mt-4 text-sm text-[#fbbf24]">
                {alert}
              </p>
            ) : null}
            {action ? <div className="mt-7">{action}</div> : null}
            {footnote && footnote.trim() ? (
              <p className="mt-6 text-xs text-[#6b7280]">{footnote}</p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
