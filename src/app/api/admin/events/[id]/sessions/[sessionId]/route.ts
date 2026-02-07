import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sessionSchema } from "@/lib/validations/session";

const routeContextSchema = z.object({
  params: z.promise(z.object({
    id: z.string(), // eventId
    sessionId: z.string(),
  })),
});

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { sessionId } = await context.params;
    const body = await req.json();
    const { title, description, startTime, endTime, location, speaker } = sessionSchema.parse(body);

    const session = await prisma.eventSession.update({
      where: {
        id: sessionId,
      },
      data: {
        title,
        description,
        startTime,
        endTime,
        location,
        speaker,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { sessionId } = await context.params;

    await prisma.eventSession.delete({
      where: {
        id: sessionId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
