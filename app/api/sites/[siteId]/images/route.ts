import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ownedSite, requireWorkspace } from "@/lib/tenant";

const bucket = "popup-images";
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function GET(_: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  if (!await ownedSite(siteId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const workspace = await requireWorkspace();
  const supabase = await createSupabaseServerClient();
  const { data: folders, error: folderError } = await supabase.storage.from(bucket).list(workspace.id, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (folderError) return NextResponse.json({ error: "Could not load the image library" }, { status: 500 });

  const results = await Promise.all((folders ?? []).map(async (entry) => {
    if (entry.metadata) return [{ path: `${workspace.id}/${entry.name}`, name: entry.name, createdAt: entry.created_at }];
    const { data, error } = await supabase.storage.from(bucket).list(`${workspace.id}/${entry.name}`, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw error;
    return (data ?? []).filter((image) => image.metadata).map((image) => ({
      path: `${workspace.id}/${entry.name}/${image.name}`,
      name: image.name,
      createdAt: image.created_at,
    }));
  }));

  const images = results.flat().sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).map((image) => ({
    ...image,
    url: supabase.storage.from(bucket).getPublicUrl(image.path).data.publicUrl,
  }));
  return NextResponse.json({ images });
}

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  if (!await ownedSite(siteId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const file = (await request.formData()).get("image");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF under 5 MB" }, { status: 400 });
  }

  const workspace = await requireWorkspace();
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${workspace.id}/${siteId}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  return NextResponse.json({ url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl });
}
