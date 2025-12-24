
import { Client } from "@notionhq/client";

// Initialize Notion Client
// Ensure NOTION_KEY and NOTION_DATABASE_ID are set in your Vercel Environment Variables
const notion = new Client({ auth: process.env.NOTION_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle Preflight Request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing Access Code (用户码)" });
  }

  try {
    // 1. Query Database filtering by "用户码" (AccessCode)
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "用户码", // Matching your specific Notion Column Name
        rich_text: { equals: code }
      }
    });

    if (response.results.length === 0) {
      return res.status(404).json({ error: "Prophecy not found" });
    }

    const page = response.results[0];
    const props = page.properties;

    // 2. Fetch Page Content (Blocks)
    // Properties only contain metadata; the actual text is in the children blocks.
    const blocks = await notion.blocks.children.list({
      block_id: page.id
    });

    // 3. Convert Blocks to Plain Text
    let content = "";
    for (const block of blocks.results) {
      // Logic for paragraph blocks
      if (block.type === "paragraph" && block.paragraph.rich_text.length > 0) {
        content += block.paragraph.rich_text.map(t => t.plain_text).join("") + "\n\n";
      }
      // Logic for headings
      else if (block.type === "heading_1" && block.heading_1.rich_text.length > 0) {
        content += "\n== " + block.heading_1.rich_text.map(t => t.plain_text).join("") + " ==\n\n";
      }
      else if (block.type === "heading_2" && block.heading_2.rich_text.length > 0) {
        content += "\n-- " + block.heading_2.rich_text.map(t => t.plain_text).join("") + " --\n\n";
      }
      else if (block.type === "heading_3" && block.heading_3.rich_text.length > 0) {
        content += block.heading_3.rich_text.map(t => t.plain_text).join("") + "\n";
      }
      // Logic for bulleted lists
      else if (block.type === "bulleted_list_item" && block.bulleted_list_item.rich_text.length > 0) {
        content += "• " + block.bulleted_list_item.rich_text.map(t => t.plain_text).join("") + "\n";
      }
    }

    // 4. Construct Response Object
    // Mapping Notion Chinese properties to frontend-friendly JSON
    const report = {
      access_code: code,
      client_name: props["姓名"]?.title?.[0]?.plain_text || "Seeker",
      title: `${props["姓名"]?.title?.[0]?.plain_text || "未知"}的命书`,
      content: content || "（命书内容为空或正在撰写中...）",
      type: props["类型"]?.select?.name || "正式版",
      birth_time: props["出生时间"]?.date?.start || "",
      birth_place: props["出生地"]?.rich_text?.[0]?.plain_text || ""
    };

    return res.status(200).json(report);
    
  } catch (error) {
    console.error("Notion API Error:", error);
    return res.status(500).json({ error: "Oracle Connection Failed" });
  }
}
