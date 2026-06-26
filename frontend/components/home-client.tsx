"use client";

import { Check, Loader2, Mic, Pencil, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessage, type ChatMessageData } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import {
  createTransaction,
  fetchConversation,
  streamAgent,
  uploadVoiceAndTranscribe,
} from "@/lib/api";
import type { ParsedTransaction } from "@/types/agent";

const CID_KEY = "expense-conversation-id";
const CATEGORIES = ["餐饮", "交通", "购物", "娱乐", "工资", "其他"];
const examples = ["昨天中午吃饭 35", "今天打车去公司 28", "工资到账 12000"];

const welcomeMessage: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content: "你好！我是你的记账助手。输入一句话就能记账，比如「中午吃饭 35」。也可以点击麦克风录音。",
  timestamp: new Date(),
};

function getConversationId(): string {
  let cid = localStorage.getItem(CID_KEY);
  if (!cid) { cid = crypto.randomUUID(); localStorage.setItem(CID_KEY, cid); }
  return cid;
}

function TransactionCard({
  data,
  onConfirm,
  onReject,
}: {
  data: ParsedTransaction;
  onConfirm: (d: ParsedTransaction) => Promise<void>;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onConfirm(draft); } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="animate-slide-down rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-[var(--shadow-sm)]">
        <div className="mb-3 text-sm font-medium">✏️ 修改</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-[var(--muted)]">备注<input className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_2px_var(--accent)]" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
          <label className="space-y-1 text-xs text-[var(--muted)]">金额<input className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_2px_var(--accent)]" type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></label>
          <label className="space-y-1 text-xs text-[var(--muted)]">类别<select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_2px_var(--accent)]" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="space-y-1 text-xs text-[var(--muted)]">类型<select className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_2px_var(--accent)]" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as "expense" | "income" })}><option value="expense">支出</option><option value="income">收入</option></select></label>
          <label className="space-y-1 text-xs text-[var(--muted)]">日期<input className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_2px_var(--accent)]" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="space-y-1 text-xs text-[var(--muted)]">商户<input className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_2px_var(--accent)]" value={draft.merchant ?? ""} onChange={(e) => setDraft({ ...draft, merchant: e.target.value || undefined })} /></label>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "确认记账"}</Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(data); }}>取消</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-down rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-[var(--shadow-sm)]">
      <div className="rounded-xl bg-[var(--background)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">{draft.note}</span>
          <span className={`tabular-nums text-lg font-semibold ${draft.type === "income" ? "text-[var(--success)]" : "text-[var(--accent)]"}`}>
            {draft.type === "income" ? "+" : "-"}¥{draft.amount.toLocaleString("zh-CN")}
          </span>
        </div>
        <div className="mt-1 flex gap-3 text-xs text-[var(--muted)]">
          <span>{draft.category}</span><span>·</span>
          <span>{draft.type === "income" ? "收入" : "支出"}</span>
          <span>·</span><span>{draft.date}</span>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}><Check className="mr-1 h-4 w-4" />确认</Button>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil className="mr-1 h-4 w-4" />编辑</Button>
        <Button variant="ghost" size="sm" onClick={onReject}><X className="mr-1 h-4 w-4" />取消</Button>
      </div>
    </div>
  );
}

export function HomeClient() {
  const [messages, setMessages] = useState<ChatMessageData[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pendingTx, setPendingTx] = useState<ParsedTransaction | null>(null);
  const [supported] = useState(() => typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia);
  const endRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cid = useRef(getConversationId());

  useEffect(() => {
    fetchConversation(cid.current).then((stored) => {
      if (stored.length === 0) return;
      setMessages(stored.map((m, i) => ({ id: `hist-${i}`, role: m.role, content: m.content, timestamp: new Date(m.timestamp) })));
    }).catch(() => {});
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, pendingTx]);

  function addMessage(role: ChatMessageData["role"], content: string) {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role, content, timestamp: new Date() }]);
  }

    function handleClear() {
    setMessages([welcomeMessage]);
    setPendingTx(null);
    const newId = crypto.randomUUID();
    localStorage.setItem(CID_KEY, newId);
    cid.current = newId;
  }

  async function handleSave(tx: ParsedTransaction) {
    await createTransaction(tx, "text");
    setPendingTx(null);
    const t = tx.type === "income" ? "收入" : "支出";
    addMessage("assistant", `✅ ${tx.category}${t} ¥${tx.amount.toLocaleString("zh-CN")} · ${tx.note}`);
  }

  async function handleSubmit(input: string) {
    const trimmed = input.trim();
    if (!trimmed || isSubmitting) return;
    setDraft("");
    addMessage("user", trimmed);
    setIsSubmitting(true);
    setPendingTx(null);

    // 添加一个空的占位消息，流式 token 会渐进填充
    const msgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: msgId, role: "assistant", content: "", timestamp: new Date() }]);

    let fullContent = "";
    try {
      await streamAgent(
        trimmed,
        "text",
        cid.current,
        // onToken: 逐步更新消息内容
        (token) => {
          fullContent += token;
          setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, content: fullContent } : m)));
        },
        // onInterrupt: 移除占位消息，显示 TransactionCard
        (parsedTx) => {
          setMessages(prev => prev.filter(m => m.id !== msgId));
          setPendingTx(parsedTx);
        },
        // onDone: 流结束，如果内容为空则设置默认值
        (_finalResponse) => {
          if (!fullContent) {
            setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, content: "已收到请求。" } : m)));
          }
        },
        // onError
        (errorMsg) => {
          setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, role: "error" as const, content: errorMsg } : m)));
        },
      );
    } catch {
      setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, role: "error" as const, content: "请求失败，请检查后端是否运行。" } : m)));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVoiceRecord() {
    if (recording) { mediaRecorderRef.current?.stop(); return; }
    if (!supported) { addMessage("error", "当前浏览器不支持录音。"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null; chunksRef.current = []; setRecording(false);
        setIsSubmitting(true);
        try {
          const data = await uploadVoiceAndTranscribe(audioBlob);
          addMessage("user", `🎤 ${data.transcript}`);

          const msgId = crypto.randomUUID();
          setMessages(prev => [...prev, { id: msgId, role: "assistant", content: "", timestamp: new Date() }]);

          let fullContent = "";
          await streamAgent(
            data.transcript,
            "voice",
            cid.current,
            (token) => {
              fullContent += token;
              setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, content: fullContent } : m)));
            },
            (parsedTx) => {
              setMessages(prev => prev.filter(m => m.id !== msgId));
              setPendingTx(parsedTx);
            },
            (_finalResponse) => {
              if (!fullContent) {
                setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, content: "已收到请求。" } : m)));
              }
            },
            (errorMsg) => {
              setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, role: "error" as const, content: errorMsg } : m)));
            },
          );
        } catch (err) {
          addMessage("error", err instanceof TypeError ? "请求失败，请检查后端是否运行。" : err instanceof Error ? err.message : "语音转写失败。");
        } finally { setIsSubmitting(false); }
      };
      recorder.start();
      setRecording(true);
    } catch { addMessage("error", "没有拿到麦克风权限。"); }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-2xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-4 pt-2">
        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        {pendingTx ? <TransactionCard data={pendingTx} onConfirm={handleSave} onReject={() => setPendingTx(null)} /> : null}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && !pendingTx && (
        <div className="mb-4 flex flex-wrap gap-2">
          {examples.map(ex => (
            <button key={ex} type="button" onClick={() => setDraft(ex)}
              className="rounded-full border border-[var(--border)] bg-white/70 px-3.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">{ex}</button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-2 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="flex items-end gap-2">
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(draft); }}}
            rows={1} placeholder="输入一句话记账，按 Enter 发送..."
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#9b8f82]" />
          <div className="flex gap-1.5 pb-1 pr-1">
            <button type="button" onClick={handleVoiceRecord} disabled={isSubmitting}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition ${recording ? "animate-recording bg-[var(--accent)] text-white" : "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"}`}
              title={recording ? "结束录音" : "开始录音"}>{recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
            <Button onClick={() => handleSubmit(draft)} disabled={isSubmitting || !draft.trim()} className="h-10 px-4">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "发送"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
