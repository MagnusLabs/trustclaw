import { protectedProcedure } from "~/server/api/trpc";
import { createComposioClient } from "~/server/clients/composio";
import { getToolkitsInput } from "./getToolkits.schema";

export const getToolkits = protectedProcedure
  .input(getToolkitsInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const composio = createComposioClient();
    const session = await composio.create(userId, {});

    // 1. Forzamos la ejecución sobre el método esperado por '@composio/vercel'
    const toolkitsResult = await (session as any).toolkits({
      ...(input.search && input.search.length >= 3
        ? { search: input.search }
        : {}),
      ...(input.isConnected !== undefined
        ? { isConnected: input.isConnected }
        : {}),
      limit: input.limit,
      cursor: input.cursor,
    });

    // Validamos de forma segura de dónde vienen los items
    const itemsList = toolkitsResult?.items || toolkitsResult?.toolkits || [];

    if (itemsList.length === 0) {
      return { items: [], nextCursor: null };
    }

    // 2. Merge and return
    const items = itemsList.map((toolkit: any) => ({
      slug: toolkit.slug,
      name: toolkit.name,
      logo: toolkit.logo ?? `https://logos.composio.dev/api/${toolkit.slug}`,
      noAuth: toolkit.isNoAuth,
      connected: !!toolkit.connection?.isActive,
    }));

    return {
      items,
      nextCursor: toolkitsResult.nextCursor ?? null,
    };
  });
