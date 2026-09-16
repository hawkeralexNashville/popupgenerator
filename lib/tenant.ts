import { db } from "./db";
import { createSupabaseServerClient } from "./supabase/server";
export async function currentUser(){const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();return user}
export async function currentWorkspace(){ const user=await currentUser(); if(!user) return null; return db.workspace.findFirst({where:{members:{some:{userId:user.id}}}}); }
export async function requireWorkspace(){ const workspace=await currentWorkspace(); if(!workspace) throw new Error("UNAUTHORIZED"); return workspace; }
export async function ownedSite(id:string){ const w=await requireWorkspace(); return db.site.findFirst({where:{id,workspaceId:w.id}}); }
export async function ownedCampaign(id:string){ const w=await requireWorkspace(); return db.campaign.findFirst({where:{id,site:{workspaceId:w.id}},include:{variants:true,site:true}}); }
export async function ownedEmbeddedForm(id:string){ const w=await requireWorkspace(); return db.embeddedForm.findFirst({where:{id,site:{workspaceId:w.id}},include:{variants:true,site:true}}); }
