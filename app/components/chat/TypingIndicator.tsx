/**
 * TypingIndicator component - Shows AI is thinking animation
 */

export function TypingIndicator() {
  return (
    <div className="chat-typing" role="status" aria-label="AI is thinking">
      <div className="chat-typing__avatar">🤖</div>
      <div className="chat-typing__dots">
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
      </div>
    </div>
  );
}
