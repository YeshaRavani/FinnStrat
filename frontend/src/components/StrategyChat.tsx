import { useEffect, useState } from "react";
import { askStrategyChat } from "../api/chatApi";
import type { StrategyChatRequest } from "../types/chat";
import { summarizeStrategy } from "../types/chat";
import type { RankedStrategy } from "../types/strategy";
import { ChatMessageContent } from "./ChatMessageContent";

type Props = {
  profile: StrategyChatRequest["profile"];
  goal: StrategyChatRequest["goal"];
  strategies: RankedStrategy[];
  selectedId: string | null;
};

const welcome = "Select a strategy, then ask me about its score, trade-offs, or stress-test result.";
const prompts = ["Why was this plan recommended?", "Which strategy is most resilient?", "What happens if I lose my income?"];

export function StrategyChat({ profile, goal, strategies, selectedId }: Props) {
  const [open, setOpen] = useState(false);
  const [chatStrategyId, setChatStrategyId] = useState(selectedId ?? "");
  const [messages, setMessages] = useState<StrategyChatRequest["messages"]>([{ role: "assistant", content: welcome }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setChatStrategyId(selectedId ?? "");
  }, [selectedId]);

  const send = async (prompt: string) => {
    const content = prompt.trim();
    if (!content || loading || !strategies.length) return;
    const userMessage = { role: "user" as const, content };
    const nextMessages = [...messages, userMessage].slice(-12);
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await askStrategyChat({
        profile,
        goal,
        strategies: strategies.map(summarizeStrategy),
        selected_strategy_id: chatStrategyId || null,
        messages: nextMessages,
      });
      setMessages(current => [...current, { role: "assistant" as const, content: response.message }].slice(-12));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The strategy chat is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const aiIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 13.4 9l4.8 1.8-4.8 1.8L12 18l-1.4-5.4-4.8-1.8L10.6 9 12 3.5Z" /><path d="m18.5 15 .6 2.4 2.2.8-2.2.8-.6 2.5-.6-2.5-2.2-.8 2.2-.8.6-2.4Z" /></svg>;

  return <aside className={`strategy-chat ${open ? "is-open" : "is-collapsed"}`} aria-label="FinnStrat AI assistant">
    {!open ? <button type="button" className="chat-open-button" onClick={() => setOpen(true)} aria-expanded="false" aria-controls="strategy-chat-panel" title="Open AI strategy guide">
      <span className="chat-ai-icon">{aiIcon}</span><span className="chat-open-label">ASK AI</span>
    </button> : <div id="strategy-chat-panel">
      <div className="strategy-chat-header">
        <div className="strategy-chat-title"><span className="chat-ai-icon">{aiIcon}</span><div><p className="section-label">FINNSTRAT AI</p><h2 id="strategy-chat-title">Strategy guide</h2><p>Ask about the selected plan.</p></div></div>
        <div className="strategy-chat-actions"><span className="chat-status"><i /> AI</span><button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Collapse AI strategy guide" title="Collapse AI strategy guide">×</button></div>
      </div>
      <label className="chat-strategy-picker"><span>ASK ABOUT</span><select value={chatStrategyId} onChange={event => setChatStrategyId(event.target.value)} disabled={loading} aria-label="Choose a strategy for your question"><option value="">All generated strategies</option>{strategies.map((item, index) => <option value={item.strategy.id} key={item.strategy.id}>{index + 1}. {item.strategy.name} — {item.strategy.type}</option>)}</select></label>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "assistant" ? "FINNSTRAT" : "YOU"}</span>{message.role === "assistant" ? <ChatMessageContent content={message.content} /> : <p>{message.content}</p>}</div>)}
        {loading && <div className="chat-message assistant"><span>FINNSTRAT</span><p className="chat-thinking">Reviewing the strategy calculations…</p></div>}
      </div>
      <div className="chat-prompts">{prompts.map(prompt => <button type="button" className="chat-prompt" key={prompt} onClick={() => { void send(prompt); }} disabled={loading}>{prompt}</button>)}</div>
      <form className="chat-composer" onSubmit={event => { event.preventDefault(); void send(input); }}>
        <input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask a question about the plan…" maxLength={1000} aria-label="Ask about your strategies" disabled={loading} />
        <button type="submit" className="primary compact" disabled={loading || !input.trim()}>Ask</button>
      </form>
      {error && <p className="chat-error" role="alert">{error}</p>}
      <p className="chat-disclaimer">Illustrative analysis only — FinnStrat does not provide regulated financial advice.</p>
    </div>}
  </aside>;
}
