"use client";

import { trpc } from "~/clients/trpc";
import { Onboarding } from "./onboarding";
import { OnboardingSkeleton } from "./onboarding.skeleton";

interface OnboardingClientProps {
  hasExistingInstance: boolean;
  hasOnboardingState: boolean;
}

export function OnboardingClient({
  hasExistingInstance,
  hasOnboardingState,
}: OnboardingClientProps) {
  const { data, isLoading } = trpc.trustclaw.getInstance.useQuery(
    undefined,
    { enabled: hasOnboardingState },
  );

  if (hasOnboardingState && isLoading) {
    return <OnboardingSkeleton />;
  }

  return (
    <Onboarding
      hasExistingInstance={hasExistingInstance}
      savedState={data?.onboardingState ?? null}
      // Force a hard reload instead of router.refresh() - this is the one-time
      // transition out of onboarding, and a full reload guarantees the server
      // re-evaluates hasInstance and swaps in the chat view no matter what the
      // client-side router cache/state currently looks like.
      onComplete={() => window.location.reload()}
    />
  );
}
