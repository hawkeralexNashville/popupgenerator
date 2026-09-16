import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("builder UX polish", () => {
  const campaignBuilder = readFileSync("components/Builder.tsx", "utf8");
  const embeddedBuilder = readFileSync("components/EmbeddedFormBuilder.tsx", "utf8");
  const imagePicker = readFileSync("components/ImageUpload.tsx", "utf8");

  it("uses the shared existing-image picker in both builders", () => {
    expect(campaignBuilder).toContain("<ImageUpload siteId={campaign.site.id}");
    expect(embeddedBuilder).toContain("<ImageUpload siteId={embeddedForm.site.id}");
    expect(imagePicker).toContain("Choose existing image");
    expect(imagePicker).toContain("onChange(image.url)");
  });

  it("uses the shared inline checkbox layout", () => {
    expect(campaignBuilder).toContain('className="checkbox-label"');
    expect(embeddedBuilder.match(/className="checkbox-label"/g)).toHaveLength(2);
  });
});

describe("compact embedded-form listing", () => {
  const websitePage = readFileSync("app/sites/[siteId]/page.tsx", "utf8");

  it("copies the complete snippet without rendering it in the card", () => {
    expect(websitePage).toContain('compact label="Copy embed code"');
    expect(websitePage).toContain('data-popup-generator-form=');
    expect(websitePage).toContain('/embed.js');
    expect(websitePage).not.toContain('<CopySnippet snippet={embed}/>');
  });
});

describe("image-library isolation", () => {
  const route = readFileSync("app/api/sites/[siteId]/images/route.ts", "utf8");

  it("authorizes the site and scopes listing and upload paths to the workspace", () => {
    expect(route.match(/ownedSite\(siteId\)/g)).toHaveLength(2);
    expect(route).toContain(".list(workspace.id");
    expect(route).toContain("`${workspace.id}/${siteId}/${crypto.randomUUID()}.${extension}`");
  });
});
