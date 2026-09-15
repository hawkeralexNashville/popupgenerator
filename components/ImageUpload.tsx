"use client";
import { useState } from "react";
export function ImageUpload({ campaignId, value, onChange }: { campaignId: string; value: string; onChange: (url: string) => void }) {
  const [status, setStatus] = useState("");
  async function upload(event: React.ChangeEvent<HTMLInputElement>) { const file=event.target.files?.[0];if(!file)return;setStatus("Uploading…");const body=new FormData();body.set("image",file);const response=await fetch(`/api/campaigns/${campaignId}/images`,{method:"POST",body});const result=await response.json();if(!response.ok)return setStatus(result.error||"Upload failed");onChange(result.url);setStatus("Uploaded") }
  return <div className="form"><label>Upload image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload}/></label>{value&&<button type="button" className="secondary" onClick={()=>onChange("")}>Remove image</button>}{status&&<small className="muted" role="status">{status}</small>}</div>;
}
