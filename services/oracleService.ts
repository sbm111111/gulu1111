
import { createClient } from '@supabase/supabase-js';
import { OracleReport, DiaryEntry } from '../types';

// --- CONFIGURATION ---

// 1. ROUTE B: NOTION LIVE (Preferred)
// You need to deploy the provided api/oracle.js to Vercel.
// Set this to your deployed URL, e.g., "https://your-project.vercel.app/api/oracle"
// If running locally with `vercel dev`, it might be "/api/oracle"
const NOTION_PROXY_URL = (import.meta as any).env?.VITE_NOTION_PROXY_URL || "/api/oracle"; 

// 2. ROUTE A: SUPABASE CACHE (Fallback / Demo)
const V0_SUPABASE_URL = "https://gucoynupohzlotilcfoz.supabase.co";
const V0_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Y295bnVwb2h6bG90aWxjZm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwMTQ0OTEsImV4cCI6MjA1MDU5MDQ5MX0.Rf6h9fCOYG4TGTL5vgCb6kgYrxULhsFWCq0kIZGSyeE";

const getEnv = (key: string) => {
    try {
        if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) return (import.meta as any).env[key];
    } catch (e) { return undefined; }
    return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || V0_SUPABASE_URL;
const supabaseKey = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || V0_SUPABASE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

// --- DIAGNOSTICS ---
export const checkOracleConnection = async (): Promise<boolean> => {
    // Check Notion Proxy first
    if (NOTION_PROXY_URL) return true;
    
    // Fallback to Supabase check
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('oracle_reports').select('id').limit(1);
        return !error;
    } catch (e) { return false; }
};

// --- CORE LOGIC: THE HYBRID FETCH ---

export const getReportByCode = async (code: string): Promise<DiaryEntry | null> => {
    
    // STRATEGY 1: Try Notion Direct (The "Route B")
    // This provides real-time updates from your Notion Database.
    if (NOTION_PROXY_URL) {
        console.log(`[Oracle] Signal sent to Notion Proxy for code: ${code}`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const res = await fetch(`${NOTION_PROXY_URL}?code=${code}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const notionData = await res.json();
                if (notionData && notionData.access_code) {
                    console.log("[Oracle] Received fresh transmission from Notion.");
                    return mapNotionToDiaryEntry(notionData);
                }
            } else {
                 console.warn(`[Oracle] Notion Proxy returned ${res.status}`);
            }
        } catch (e) {
            console.warn("[Oracle] Notion Proxy silent. Engaging fallback protocols.", e);
        }
    }

    // STRATEGY 2: Fallback to Supabase (The "Route A")
    // If Notion is slow/down or Proxy not set up, use the cached version.
    if (supabase) {
        try {
            console.log(`[Oracle] Searching local cache (Supabase) for code: ${code}`);
            const { data, error } = await supabase
                .from('oracle_reports')
                .select('*')
                .eq('access_code', code)
                .single();

            if (data && !error) {
                return mapDbToDiaryEntry(data);
            }
        } catch (err) {
            console.error("Cache Lookup Failed:", err);
        }
    }

    // STRATEGY 3: Local Demo Fallback (For instant gratification during testing)
    if (code === '8888') {
         return {
            id: 'demo-report',
            title: "DEMO: The Starry Night",
            date: new Date().toLocaleDateString(),
            content: "【系统提示：正在读取本地演示数据】\n\n星辰在低语，你的灵魂底色是深邃的黑。这张牌象征着潜意识的觉醒...",
            imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop",
            tags: ["Demo", "Oracle"]
        };
    }

    return null;
};

// --- ADMIN FACING (Legacy/Cache Management) ---

export const createOracleReport = async (report: Omit<OracleReport, 'id' | 'created_at'>): Promise<boolean> => {
    if(!supabase) {
        alert("Database connection failed.");
        return false;
    }
    try {
        // Upsert allows us to update existing records too (acting as a manual cache refresh)
        const { error } = await supabase
            .from('oracle_reports')
            .upsert([{
                access_code: report.access_code,
                client_name: report.client_name,
                title: report.title,
                content: report.content,
                image_url: report.image_url,
                type: report.type
            }], { onConflict: 'access_code' });
            
        if(error) throw error;
        return true;
    } catch (e: any) {
        alert("Sync Error: " + e.message);
        return false;
    }
};

export const deleteOracleReport = async (access_code: string): Promise<boolean> => {
    if(!supabase) return false;
    try {
        const { error } = await supabase.from('oracle_reports').delete().eq('access_code', access_code);
        return !error;
    } catch (e) { return false; }
};

export const getAllReports = async (): Promise<OracleReport[]> => {
    if(!supabase) return [];
    const { data, error } = await supabase.from('oracle_reports').select('*').order('created_at', { ascending: false });
    return error ? [] : (data || []);
};

// --- MAPPERS ---

const mapDbToDiaryEntry = (data: any): DiaryEntry => {
    return {
        id: data.id ? data.id.toString() : 'unknown',
        title: data.title || "The Oracle Speaks",
        date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        content: data.content || "Content missing...",
        imageUrl: data.image_url || "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop",
        tags: ['ORACLE', (data.type || 'FATE').toUpperCase(), (data.client_name || 'SEEKER').toUpperCase()]
    };
};

const mapNotionToDiaryEntry = (data: any): DiaryEntry => {
    // We construct the content string to include the metadata (Birth time/Place) 
    // because the UI displays the 'content' field primarily.
    
    let formattedContent = "";
    
    if (data.birth_time || data.birth_place) {
        formattedContent += `【命盘信息】\n`;
        if (data.birth_time) formattedContent += `时间：${data.birth_time}\n`;
        if (data.birth_place) formattedContent += `地点：${data.birth_place}\n`;
        formattedContent += `\n------------------\n\n`;
    }
    
    formattedContent += (data.content || "...");

    // Default Mystic Image since simplified Notion API doesn't fetch covers yet
    const defaultImage = "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop";

    return {
        id: `notion-${data.access_code}`,
        title: data.title || "Notion Transmission",
        date: new Date().toLocaleDateString(), 
        content: formattedContent,
        imageUrl: data.image_url || defaultImage,
        tags: [
            'ORACLE', 
            'LIVE', 
            (data.client_name || 'SEEKER').toUpperCase(),
            (data.type || 'FATE').toUpperCase()
        ]
    };
};
