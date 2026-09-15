import { db } from "./db";
import { createSupabaseServerClient } from "./supabase/server";

export class WorkspaceAuthError extends Error {
  constructor(public readonly reason: "NO_SESSION" | "NO_WORKSPACE") {
    super("UNAUTHORIZED");
    this.name = "WorkspaceAuthError";
  }
}

export function isWorkspaceAuthError(
  error: unknown,
): error is WorkspaceAuthError {
  return error instanceof WorkspaceAuthError;
}

export async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("Supabase authentication failed: no user/session", {
      error: error?.message,
    });
  }

  return user;
}

export async function currentWorkspace() {
  const user = await currentUser();
  if (!user) return null;

  return db.workspace.findFirst({
    where: { members: { some: { userId: user.id } } },
  });
}

export async function requireWorkspace() {
  const user = await currentUser();
  if (!user) throw new WorkspaceAuthError("NO_SESSION");

  const workspace = await db.workspace.findFirst({
    where: { members: { some: { userId: user.id } } },
  });
  if (!workspace) {
    console.warn("Workspace authorization failed: authenticated user has no workspace", {
      userId: user.id,
    });
    throw new WorkspaceAuthError("NO_WORKSPACE");
  }

  return workspace;
}

export async function ownedSite(id: string) {
  const workspace = await requireWorkspace();
  return db.site.findFirst({ where: { id, workspaceId: workspace.id } });
}

export async function ownedCampaign(id: string) {
  const workspace = await requireWorkspace();
  return db.campaign.findFirst({
    where: { id, site: { workspaceId: workspace.id } },
    include: { variants: true, site: true },
  });
}
