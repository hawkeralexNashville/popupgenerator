import { NextResponse } from "next/server";
import { ownedCampaign, requireWorkspace } from "@/lib/tenant";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export async function POST(request: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  if (!await ownedCampaign(campaignId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const file = (await request.formData()).get("image");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF under 5 MB" }, { status: 400 });
  const workspace = await requireWorkspace();
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${workspace.id}/${campaignId}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from("popup-images").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  return NextResponse.json({ url: supabase.storage.from("popup-images").getPublicUrl(path).data.publicUrl });
}
