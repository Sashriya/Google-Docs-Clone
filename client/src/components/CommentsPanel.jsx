import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { MdClose, MdSend, MdComment, MdReply, MdExpandMore, MdExpandLess } from "react-icons/md";

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const Avatar = ({ name, size = 8 }) => {
  const colors = [
    "bg-blue-500","bg-purple-500","bg-green-500","bg-red-500",
    "bg-yellow-500","bg-pink-500","bg-indigo-500","bg-teal-500",
  ];
  const idx   = name ? name.charCodeAt(0) % colors.length : 0;
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className={`w-${size} h-${size} rounded-full ${colors[idx]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
      {letter}
    </div>
  );
};

const ReplyItem = ({ reply }) => (
  <div className="flex gap-2 mt-2 pl-2 border-l-2 border-gray-100">
    <Avatar name={reply.userName || reply.user?.name || "?"} size={6} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-800 truncate">
          {reply.userName || reply.user?.name || "Unknown"}
        </span>
        {reply.createdAt && (
          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(reply.createdAt)}</span>
        )}
      </div>
      <p className="text-xs text-gray-600 mt-0.5 break-words">{reply.text}</p>
    </div>
  </div>
);

const CommentItem = ({ comment, onAddReply }) => {
  const { user } = useContext(AuthContext);
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const authorName = comment.user?.name || comment.userName || "Unknown";

  const submitReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await onAddReply(comment._id, {
        text: trimmed,
        user: user?._id,
        userName: user?.name,
        createdAt: new Date().toISOString(),
      });
      setReplyText("");
      setShowReplyBox(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <Avatar name={authorName} size={7} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-800 truncate">{authorName}</span>
            {comment.createdAt && (
              <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-1 break-words leading-relaxed">{comment.text}</p>
        </div>
      </div>
      
      {comment.replies?.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 font-medium mb-1"
          >
            {showReplies ? <MdExpandLess /> : <MdExpandMore />}
            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
          </button>
          {showReplies && comment.replies.map((r, i) => (
            <ReplyItem key={r._id || i} reply={r} />
          ))}
        </div>
      )}
      
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => setShowReplyBox((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600 transition"
        >
          <MdReply className="text-sm" /> Reply
        </button>
      </div>

      {showReplyBox && (
        <div className="mt-2 flex gap-2 items-end">
          <input
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); }
              if (e.key === "Escape") setShowReplyBox(false);
            }}
            placeholder="Write a reply…"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
          <button
            onClick={submitReply}
            disabled={!replyText.trim() || sending}
            className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition"
          >
            <MdSend className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
};

const CommentsPanel = ({ comments, onAddComment, onAddReply, onClose }) => {
  const { user } = useContext(AuthContext);
  const [newText, setNewText] = useState("");
  const [sending, setSending] = useState(false);

  const submitComment = async () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await onAddComment({
        text: trimmed,
        user: user?._id,
        userName: user?.name,
        createdAt: new Date().toISOString(),
        replies: [],
      });
      setNewText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-[#F8F9FA] border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MdComment className="text-[#4285F4] text-lg" />
          <span className="text-sm font-semibold text-gray-800">Comments</span>
          {comments.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition text-gray-500"
        >
          <MdClose />
        </button>
      </div>
      
      <div className="px-3 py-3 bg-white border-b border-gray-200">
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitComment();
          }}
          placeholder="Add a comment… (Ctrl+Enter to send)"
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
        />
        <div className="flex justify-end mt-1.5">
          <button
            onClick={submitComment}
            disabled={!newText.trim() || sending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4285F4] text-white text-xs font-semibold rounded-full hover:bg-[#1a73e8] disabled:opacity-40 transition"
          >
            {sending
              ? <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              : <MdSend className="text-sm" />}
            {sending ? "Sending…" : "Comment"}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <MdComment className="text-3xl opacity-30" />
            <p className="text-xs text-center">No comments yet.<br />Be the first to comment!</p>
          </div>
        ) : (
          [...comments].reverse().map((c, i) => (
            <CommentItem
              key={c._id || i}
              comment={c}
              onAddReply={onAddReply}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsPanel;