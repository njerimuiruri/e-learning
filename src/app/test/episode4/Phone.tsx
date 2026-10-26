// ============================================================
// PHONE (chat screen)
// ------------------------------------------------------------
// A cartoon smartphone showing a chat: message bubbles, a
// "typing…" indicator, and a text box with a Send button.
//
//   messages   the chat so far (from "me" or the "bot")
//   typing     true = show the "…" bubble
//   draft      the question waiting in the text box
//   onSend     what Send does (no onSend = the button is greyed out)
//   guess      a word floating above the phone while the bot
//              writes, as a reminder that it predicts words
// ============================================================

export interface ChatMessage {
  from: "me" | "bot";
  text: string;
  /** A small English translation under the message */
  translation?: string;
}

interface PhoneProps {
  messages: ChatMessage[];
  typing?: boolean;
  draft?: string;
  draftNote?: string;
  onSend?: () => void;
  guess?: string | null;
}

export default function Phone({ messages, typing = false, draft = "", draftNote, onSend, guess }: PhoneProps) {
  return (
    <div className="tm-chatphone" role="group" aria-label="A smartphone chat screen">
      {guess && (
        <span key={guess} className="tm-chat-guess" aria-hidden="true">
          next word: <strong>{guess}</strong>
        </span>
      )}
      <div className="tm-chatphone-top" aria-hidden="true">
        <span className="tm-chatphone-notch" />
        <span>💬 Ask AI</span>
      </div>
      <div className="tm-chatphone-screen" aria-live="polite">
        {messages.length === 0 && !typing && <p className="tm-chat-empty">Ask me anything about farming or the weather.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`tm-chat-msg is-${m.from}`}>
            <p>{m.text}</p>
            {m.translation && <p className="tm-chat-translation">🇬🇧 {m.translation}</p>}
          </div>
        ))}
        {typing && (
          <div className="tm-chat-msg is-bot tm-chat-typing" aria-label="The phone is typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      <div className="tm-chatphone-input">
        <div className="tm-chatphone-draft">
          <span>{draft || "…"}</span>
          {draftNote && <small>{draftNote}</small>}
        </div>
        <button type="button" className={`tm-chatphone-send ${onSend ? "tm-attention" : ""}`} onClick={onSend} disabled={!onSend} aria-label="Send">
          ➤
        </button>
      </div>
    </div>
  );
}
