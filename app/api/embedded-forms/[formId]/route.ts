import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { variantConfigSchema } from "@/lib/schemas";
import { ownedEmbeddedForm } from "@/lib/tenant";
const body=z.object({name:z.string().min(1).max(120),status:z.enum(["DRAFT","ACTIVE","PAUSED"]),variants:z.array(z.object({id:z.string().optional(),name:z.string().min(1).max(80),enabled:z.boolean(),config:variantConfigSchema})).min(1)});
export async function PUT(req:Request,{params}:{params:Promise<{formId:string}>}){const {formId}=await params,form=await ownedEmbeddedForm(formId);if(!form)return NextResponse.json({error:"Not found"},{status:404});const parsed=body.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});await db.$transaction(async(tx:Prisma.TransactionClient)=>{await tx.embeddedForm.update({where:{id:formId},data:{name:parsed.data.name,status:parsed.data.status}});const keep=parsed.data.variants.flatMap(v=>v.id?[v.id]:[]);await tx.embeddedFormVariant.deleteMany({where:{embeddedFormId:formId,id:{notIn:keep}}});for(const v of parsed.data.variants){if(v.id)await tx.embeddedFormVariant.updateMany({where:{id:v.id,embeddedFormId:formId},data:{name:v.name,enabled:v.enabled,config:v.config}});else await tx.embeddedFormVariant.create({data:{embeddedFormId:formId,name:v.name,enabled:v.enabled,config:v.config}})}});return NextResponse.json({ok:true})}
