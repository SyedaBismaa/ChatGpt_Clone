import React, { useState } from "react";
import "./NameChatModal.css";

/**
 * A modal dialog for naming a new chat session.
 *
 * Props:
 * - onCancel: function → called when the user cancels (clicks "Cancel" or closes modal)
 * - onSubmit: function(title: string) → called when the user submits a chat title
 */
const NameChatModal = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return; // Prevent empty names
    onSubmit(trimmed); // Pass the title up to parent (e.g. Home.jsx)
    setTitle(""); // Reset input
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h2 className="modal-title">Name Your Chat</h2>

        {/* Form for chat title */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chat title..."
            className="modal-input"
            aria-label="Chat title"
            autoFocus
          />

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-submit">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NameChatModal;
