import { protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/clients/db";

export const deleteInstance = protectedProcedure.mutation(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  return db.$transaction(async (tx) => {
    const instance = await tx.composioClawInstance.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (instance) {
      await tx.message.deleteMany({
        where: { instanceId: instance.id },
      });
      await tx.cronJob.deleteMany({
        where: { instanceId: instance.id },
      });
      await tx.$queryRaw`DELETE FROM composio_claw_memory WHERE "instanceId" = ${instance.id}`;
      await tx.composioClawInstance.delete({
        where: { id: instance.id },
      });
    }

    // Always clear onboarding progress too, even if the instance was already
    // gone - otherwise a leftover onboardingState row (from a previous
    // delete, before this cleanup was wired in) leaves the wizard resuming
    // on a stale later step with no instance to match it.
    await tx.onboardingState.deleteMany({
      where: { userId },
    });

    return { success: true };
  });
});
