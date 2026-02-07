import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sessionSchema } from "@/lib/validations/session";

const routeContextSchema = z.object({
  params: z.promise(z.object({
    id: z.string(),
  })),
});

export async function GET(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    // await for params
    const { id } = await context.params;

    const sessions = await prisma.eventSession.findMany({
      where: {
        eventId: id,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, description, startTime, endTime, location, speaker } = sessionSchema.parse(body);

    const session = await prisma.eventSession.create({
      data: {
        eventId: id,
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
