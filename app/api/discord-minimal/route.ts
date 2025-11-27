export async function POST(req: Request) {
  const body = await req.json();
  if (body.type === 1) {
    return Response.json({ type: 1 });
  }
  return Response.json({ error: "Not implemented" }, { status: 501 });
}

export async function GET() {
  return Response.json({ message: "Minimal Discord endpoint" });
}
