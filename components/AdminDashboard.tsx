
import React, { useState, useEffect } from 'react';
import { Theme, OracleReport } from '../types';
import { createOracleReport, getAllReports, deleteOracleReport, checkOracleConnection } from '../services/oracleService';

interface AdminDashboardProps {
  theme: Theme;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ theme, onClose }) => {
  const isDark = theme === 'dark';
  const [reports, setReports] = useState<OracleReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'list'>('import');
  const [copyStatus, setCopyStatus] = useState('Copy Agent Prompt');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  // JSON Import State
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
      checkDb();
  }, []);

  useEffect(() => {
      if(activeTab === 'list') loadReports();
  }, [activeTab]);

  const checkDb = async () => {
      setDbStatus('checking');
      const isConnected = await checkOracleConnection();
      setDbStatus(isConnected ? 'connected' : 'offline');
  };

  const loadReports = async () => {
      setLoading(true);
      const data = await getAllReports();
      setReports(data);
      setLoading(false);
  };

  const handleCopyPrompt = () => {
      const prompt = `【系统指令：生成数据库格式】
请基于刚才生成的命理分析内容，输出一个严格的 JSON 数据块。
不要包含任何 Markdown 标记（如 \`\`\`json ），只输出纯文本 JSON。

格式要求如下：
{
  "access_code": "在这里填入分配给该客户的唯一访问码（如：8888，可以是数字或字母）",
  "client_name": "客户姓名",
  "title": "命书标题（如：2024流年运势分析）",
  "type": "类型（可选值：lite, full, year, synastry）",
  "image_url": "请从 Unsplash 找一张符合该命书意境的图片URL (source.unsplash.com 已失效，请使用 images.unsplash.com 的完整长链接)",
  "content": "这里放入完整的命书正文。注意：文中必须保留换行符 \\n 以确保排版美观。"
}`;
      navigator.clipboard.writeText(prompt);
      setCopyStatus('COPIED!');
      setTimeout(() => setCopyStatus('Copy Agent Prompt'), 2000);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setJsonInput(val);
      
      // Auto-preview logic
      try {
          // Remove potential markdown wrappers if user copied carelessly
          const cleanJson = val.replace(/```json/g, '').replace(/```/g, '').trim();
          
          if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
              const parsed = JSON.parse(cleanJson);
              setPreviewData(parsed);
          }
      } catch (e) {
          // invalid json, ignore preview
      }
  };

  const handlePublish = async () => {
      if (!previewData) return;
      setLoading(true);
      
      const payload = {
        access_code: (previewData.access_code || previewData.code || '').toString(),
        client_name: previewData.client_name || previewData.name || 'Seeker',
        title: previewData.title || 'The Oracle Report',
        type: previewData.type || 'full',
        image_url: previewData.image_url || previewData.cover || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop',
        content: previewData.content || ''
      };

      if (!payload.access_code) {
          alert("Missing 'access_code' in JSON.");
          setLoading(false);
          return;
      }

      const success = await createOracleReport(payload);
      
      if (success) {
          setJsonInput('');
          setPreviewData(null);
          alert(`Success! Code [${payload.access_code}] is now live.`);
          setActiveTab('list');
      } 
      setLoading(false);
  };

  const handleDelete = async (code: string) => {
      if(confirm(`Revoke soul contract [${code}]? This cannot be undone.`)) {
          await deleteOracleReport(code);
          loadReports();
      }
  };

  // --- Styles ---
  const StatusColor = dbStatus === 'connected' ? 'bg-gemini shadow-[0_0_10px_#00D668]' : 'bg-red-500 shadow-[0_0_10px_red]';
  const StatusText = dbStatus === 'connected' ? 'SUPABASE ONLINE' : (dbStatus === 'checking' ? 'CHECKING...' : 'OFFLINE');

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-xl transition-colors
        ${isDark ? 'bg-black/95' : 'bg-cloud/95'}`}>
        
        <div className={`w-full max-w-5xl h-[90vh] flex flex-col border rounded-2xl overflow-hidden shadow-2xl relative transition-colors
            ${isDark ? 'border-zinc-800 bg-black' : 'border-zinc-300 bg-white'}`}>
            
            {/* Header / Control Bar */}
            <div className={`flex items-center justify-between px-8 py-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="flex items-center gap-4">
                    <h2 className={`font-serif text-xl tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                        ORACLE // DECK
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 cursor-pointer" onClick={checkDb} title="Click to retry connection">
                        <div className={`w-2 h-2 rounded-full ${StatusColor} transition-colors`}></div>
                        <span className={`text-[9px] font-mono tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{StatusText}</span>
                    </div>
                </div>
                
                <div className="flex gap-6">
                     <button onClick={() => setActiveTab('import')} className={`text-xs uppercase tracking-widest transition-colors ${activeTab === 'import' ? 'text-gemini border-b border-gemini' : 'text-zinc-500 hover:text-zinc-300'}`}>Transmission</button>
                     <button onClick={() => setActiveTab('list')} className={`text-xs uppercase tracking-widest transition-colors ${activeTab === 'list' ? 'text-gemini border-b border-gemini' : 'text-zinc-500 hover:text-zinc-300'}`}>Registry</button>
                     <button onClick={onClose} className="text-zinc-500 hover:text-red-500 ml-4">CLOSE</button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden relative flex">
                
                {/* 1. TRANSMISSION TAB (Smart Import) */}
                {activeTab === 'import' && (
                    <div className="w-full h-full flex flex-col md:flex-row">
                        
                        {/* Left: Input Area */}
                        <div className={`w-full md:w-1/2 h-full border-r p-8 flex flex-col ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className={`font-mono text-xs uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Data Stream</h3>
                                 <button onClick={handleCopyPrompt} className={`text-[10px] px-3 py-1 border rounded hover:bg-gemini hover:text-black transition-colors ${isDark ? 'border-zinc-700 text-gemini' : 'border-zinc-300 text-zinc-700'}`}>
                                     {copyStatus}
                                 </button>
                             </div>
                             <textarea 
                                value={jsonInput}
                                onChange={handleJsonChange}
                                placeholder="// 1. Click 'Copy Agent Prompt' above&#10;// 2. Paste to Notion Agent&#10;// 3. Paste the returned JSON here..."
                                className={`flex-1 w-full font-mono text-xs leading-relaxed p-4 rounded-lg outline-none resize-none transition-colors
                                    ${isDark ? 'bg-zinc-900/50 text-gemini placeholder-zinc-700' : 'bg-zinc-50 text-zinc-800 placeholder-zinc-400'}`}
                             />
                        </div>

                        {/* Right: Smart Preview (The "Review" Step) */}
                        <div className="w-full md:w-1/2 h-full p-8 flex flex-col items-center justify-center relative overflow-hidden">
                             {/* Background Grid */}
                             <div className={`absolute inset-0 opacity-10 pointer-events-none ${isDark ? 'bg-[url("https://grainy-gradients.vercel.app/noise.svg")]' : ''}`}></div>

                             {!previewData ? (
                                 <div className={`text-center opacity-40 flex flex-col items-center animate-pulse ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                     <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                     <p className="font-serif tracking-widest text-sm">AWAITING SIGNAL</p>
                                 </div>
                             ) : (
                                 <div className="w-full max-w-sm animate-fade-in relative z-10">
                                     {/* Preview Card */}
                                     <div className={`rounded-xl border p-6 mb-8 backdrop-blur-md shadow-2xl relative overflow-hidden group
                                         ${isDark ? 'border-white/10 bg-black/60' : 'border-zinc-300 bg-white/80'}`}>
                                         
                                         {/* Image Strip */}
                                         <div className="h-24 w-full mb-4 rounded-lg overflow-hidden relative">
                                             <img src={previewData.image_url || previewData.cover} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="cover"/>
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                             <div className="absolute bottom-2 left-2 text-white font-mono text-[10px]">{previewData.access_code}</div>
                                         </div>

                                         <h3 className={`font-serif text-2xl mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{previewData.title}</h3>
                                         <div className="flex gap-2 mb-4">
                                              <span className="text-[9px] border border-zinc-600 px-1 rounded text-zinc-500">{previewData.type}</span>
                                              <span className="text-[9px] border border-zinc-600 px-1 rounded text-zinc-500">{previewData.client_name}</span>
                                         </div>
                                         <p className={`font-sans text-xs line-clamp-4 leading-relaxed opacity-70 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                             {previewData.content}
                                         </p>
                                     </div>

                                     <button 
                                        onClick={handlePublish}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-lg font-mono text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 shadow-lg
                                            ${loading ? 'opacity-50 cursor-wait' : 'opacity-100'}
                                            ${isDark ? 'bg-gemini text-black hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-700'}`}
                                     >
                                         {loading ? 'MATERIALIZING...' : 'INJECT RECORD'}
                                     </button>
                                 </div>
                             )}
                        </div>
                    </div>
                )}

                {/* 2. REGISTRY TAB */}
                {activeTab === 'list' && (
                    <div className="w-full h-full overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-3">
                            {reports.length === 0 && (
                                <div className={`text-center py-10 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                    Registry Empty
                                </div>
                            )}
                            {reports.map(r => (
                                <div key={r.id} className={`flex items-center justify-between p-5 border rounded-lg transition-all hover:translate-x-1 group
                                    ${isDark ? 'border-zinc-800 bg-zinc-900/40 hover:border-gemini/50' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`font-mono text-xs px-2 py-1 rounded min-w-[60px] text-center ${isDark ? 'bg-zinc-800 text-gemini' : 'bg-zinc-200 text-zinc-700'}`}>
                                            {r.access_code}
                                        </div>
                                        <div>
                                            <div className={`font-serif text-lg ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{r.title}</div>
                                            <div className={`text-xs opacity-50 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{r.client_name} • {new Date(r.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(r.access_code)}
                                        className="opacity-0 group-hover:opacity-100 px-4 py-2 text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded transition-all"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};
