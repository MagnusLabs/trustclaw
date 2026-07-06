import { protectedProcedure } from "~/server/api/trpc";
import { createComposioClient } from "~/server/clients/composio";
import { getToolkitsInput } from "./getToolkits.schema";

export const getToolkits = protectedProcedure
  .input(getToolkitsInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const composio = createComposioClient();
    const session = await composio.create(userId, {});

    // 1. Fetch toolkit listing usando el método correcto 'getToolkits'
    const toolkitsResult = await session.getToolkits({
      ...(input.search && input.search.length >= 3
        ? { search: input.search }
        : {}),
      ...(input.isConnected !== undefined
        ? { isConnected: input.isConnected }
        : {}),
      limit: input.limit,
      cursor: input.cursor, // Ahora sí es aceptado aquí
    });

    // En el nuevo SDK, la lista suele venir en 'toolkits' o mapeada directamente
    const rawToolkits = toolkitsResult.toolkits || toolkitsResult.items || [];

    if (rawToolkits.length === 0) {
      return { items: [], nextCursor: null };
    }

    // 2. Merge and return
    const items = rawToolkits.map((toolkit) => ({
      slug: toolkit.slug,
      name: toolkit.name,
      logo: toolkit.logo ?? `https://logos.composio.dev/api/${toolkit.slug}`,
      noAuth: toolkit.isNoAuth,
      connected: !!toolkit.connection?.isActive,
    }));

    return {
      items,
      // Ajustamos el cursor de salida según el nuevo esquema de respuesta
      nextCursor: toolkitsResult.nextCursor ?? null,
    };
  });
