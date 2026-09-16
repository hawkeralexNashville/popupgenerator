import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { defaultVariant } from "@/lib/schemas";
import { ownedSite } from "@/lib/tenant";
export async function POST(req:Request,{params}:{params:Promise<{siteId:string}>}){const {siteId}=await params;if(!await ownedSite(siteId))return NextResponse.json({error:"Not found"},{status:404});const body=z.object({name:z.string().min(1).max(120)}).safeParse(await req.json());if(!body.success)return NextResponse.json({error:"Enter a form name"},{status:400});const form=await db.embeddedForm.create({data:{siteId,name:body.data.name,variants:{create:{name:"Variant A",config:defaultVariant}}}});return NextResponse.json(form,{status:201})}
