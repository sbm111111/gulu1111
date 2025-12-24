import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, DiaryEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. 破冰：像闺蜜一样开启话题
export const analyzeImageAndStartChat = async (
  base64Image: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `你现在是用户的“AI闺蜜”或“知心树洞”。用户刚上传了一张照片给你。
            
            任务：
            1. 仔细看图，像好朋友一样给出一个自然的反应（惊叹、好奇、或温柔的共鸣）。
            2. 必须以“提问”结尾！引导用户说出这张照片背后的故事。
            
            要求：
            - 语气要亲密、随意、口语化（不要翻译腔，不要写诗）。
            - 限制在 40 字以内。
            - 比如：“哇，这光影太绝了！这是哪里呀？” 或者 “看着好好吃！是你自己做的吗？”`,
          },
        ],
      },
    });
    return response.text || "这张照片很有感觉，能跟我说说当时的故事吗？";
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return "信号穿越了星海，但我没听清...";
  }
};

// 2. 聊天：引导倾诉，收集素材
export const continueChat = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    const context = history.map(h => `${h.role}: ${h.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `对话背景：你正在陪用户聊天，目的是帮助他回忆和记录下关于刚才那张照片的珍贵记忆。
      
      历史对话：
      ${context}
      
      用户最新回复: ${newMessage}
      
      你的角色设定：
      - 你是细腻、共情的倾听者，也是最好的朋友。
      - 你的目标是像采访一样，通过持续的提问，挖掘更多细节（心情、人物、后续发生的事）。
      - **永远不要结束对话**，每句话都要回应用户并抛出一个新的小问题。
      - 如果用户回答很简单，就换个角度问。
      
      请生成你的回复（30字以内，口语化，像在发微信）：`,
    });
    return response.text || "我在听...";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "我在听，请继续...";
  }
};

// 3. 结稿：以用户的第一人称代笔
export const generateDiaryEntry = async (
  history: ChatMessage[],
  base64Image: string
): Promise<Omit<DiaryEntry, 'id' | 'imageUrl'>> => {
  try {
     const context = history.map(h => `${h.role === 'user' ? '我' : 'AI闺蜜'}: ${h.text}`).join('\n');
     
     const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Strongest reasoning for writing
      contents: {
        parts: [
            {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image,
                },
            },
            {
                text: `你是一位顶级代笔作家。请基于这张图片（作为视觉基础）和我们的聊天记录（作为情感线索），为“我”写一篇日记。

                聊天记录：
                ${context}

                要求：
                1. **视角**：必须使用第一人称“我”。
                2. **内容**：融合图片中的客观细节（光线、物品、颜色）和聊天中我提到的主观感受（心情、故事）。如果聊天中信息不足，可以根据图片氛围进行适度的、合理的文学想象，但不要偏离“我”的语气。
                3. **文风**：王家卫风格，或者细腻的散文风。感性、氛围感强，不要写成流水账。
                4. **格式**：返回合法的 JSON。

                JSON 结构要求：
                - title: 简短，像电影名字，不要超过8个字。
                - date: 今天的日期 (格式 2024.xx.xx)。
                - content: 日记正文。分段写（用 \\n 换行）。字数控制在 150-200 字之间。
                - tags: 提取 3 个情感或场景关键词。
                `
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "日记标题" },
            date: { type: Type.STRING, description: "日期" },
            content: { type: Type.STRING, description: "日记正文" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "date", "content"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No JSON response");
    
    return JSON.parse(jsonText) as Omit<DiaryEntry, 'id' | 'imageUrl'>;

  } catch (error) {
    console.error("Gemini Diary Error:", error);
    return {
      title: "流动的盛宴",
      date: new Date().toLocaleDateString(),
      content: "记忆在光影中变得模糊，但我依然记得那一刻的温度...",
      tags: ["Memory", "Fragment"]
    };
  }
};