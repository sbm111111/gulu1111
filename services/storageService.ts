import { DiaryEntry } from '../types';

// --- CONFIGURATION ---
const API_BASE_URL = "https://v0-github-project-upload-kappa.vercel.app";

// --- INDEXED DB SETUP (replaces localStorage) ---
const DB_NAME = 'GeminiDiaryDB';
const STORE_NAME = 'memories';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveToIndexedDB = async (entry: DiaryEntry): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("IndexedDB Save Error:", error);
  }
};

const getFromIndexedDB = async (): Promise<DiaryEntry[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB Read Error:", error);
    return [];
  }
};

const deleteFromIndexedDB = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("IndexedDB Delete Error:", error);
  }
};

// --- TYPES FOR V0 BACKEND ---
interface V0Memory {
  id: string;
  image_url: string;
  conversations: { user: string; ai: string }[];
  created_at: string;
}

// --- ADAPTER LAYER ---
const mapToBackendPayload = (entry: DiaryEntry) => {
  const metadata = JSON.stringify({
    title: entry.title,
    date: entry.date,
    content: entry.content,
    tags: entry.tags || []
  });

  return {
    image_url: entry.imageUrl,
    conversations: [
      {
        user: "DIARY_METADATA",
        ai: metadata
      }
    ]
  };
};

const mapFromBackendResponse = (memory: V0Memory): DiaryEntry | null => {
  try {
    const firstTurn = memory.conversations?.[0];
    if (!firstTurn || !firstTurn.ai) return null;

    const metadata = JSON.parse(firstTurn.ai);
    
    return {
      id: memory.id,
      imageUrl: memory.image_url,
      title: metadata.title || "Untitled Memory",
      date: metadata.date || new Date(memory.created_at).toLocaleDateString(),
      content: metadata.content || "",
      tags: metadata.tags || []
    };
  } catch (e) {
    console.warn("Failed to parse memory from backend:", memory.id, e);
    return null;
  }
};

// --- API METHODS WITH FALLBACK ---

const isPlaceholderUrl = API_BASE_URL.includes("your-app.vercel.app");

export const saveMemoryToDB = async (entry: DiaryEntry): Promise<void> => {
  // Always save to IndexedDB first as a reliable backup
  await saveToIndexedDB(entry);

  if (isPlaceholderUrl) {
      console.warn("Storage: API URL not configured, keeping data local.");
      return;
  }

  try {
      const payload = mapToBackendPayload(entry);
      // Increased timeout to 15s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE_URL}/api/memories`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  } catch (error) {
      // Quietly fail to local storage (already saved above)
      console.warn("Storage: API Save Failed (using local backup)", error);
  }
};

export const getAllMemoriesFromDB = async (): Promise<DiaryEntry[]> => {
  // Fetch local data asynchronously
  const localMemories = await getFromIndexedDB();
  
  if (isPlaceholderUrl) {
      return localMemories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${API_BASE_URL}/api/memories`, {
        method: 'GET',
        signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();
    const v0Memories: V0Memory[] = data.memories || [];

    const apiMemories = v0Memories
      .map(mapFromBackendResponse)
      .filter((m): m is DiaryEntry => m !== null);
    
    // Merge Strategy: Combine API and Local, deduplicating by ID
    const combined = [...apiMemories, ...localMemories];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  } catch (error) {
    console.log("Storage: API unavailable, using local cache."); 
    return localMemories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};

export const deleteMemoryFromDB = async (id: string): Promise<void> => {
  await deleteFromIndexedDB(id); 

  if (!isPlaceholderUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_BASE_URL}/api/memories/${id}`, {
            method: 'DELETE',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(response.statusText);
      } catch (error) {
          console.warn("Storage: API Delete Failed (deleted locally)", error);
      }
  }
};