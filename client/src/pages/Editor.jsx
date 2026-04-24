import React, { useEffect, useRef, useState, useCallback } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import EditorNavbar from "../components/EditorNavbar";
import CommentsPanel from "../components/CommentsPanel";
import VersionHistoryPanel from "../components/VersionHistoryPanel";

const Size = Quill.import("attributors/style/size");
Size.whitelist = Array.from({ length: 100 }, (_, i) => `${i + 1}px`);
Quill.register(Size, true);

const CURSOR_COLORS = [
  "#e53935", "#8e24aa", "#1e88e5", "#00897b",
  "#f4511e", "#6d4c41", "#3949ab", "#039be5",
];

const ZOOM_OPTIONS = [50, 75, 100, 125, 150];

const Editor = () => {
  const { id: docId } = useParams();
  const socketRef          = useRef(null);
  const editorContainerRef = useRef(null);
  const quillInstance      = useRef(null);
  const cursorLayerRef     = useRef(null);
  const cursorMapRef       = useRef({});

  const [docTitle, setDocTitle]         = useState("Untitled document");
  const [editorHTML, setEditorHTML]     = useState("");
  const [zoom, setZoom]                 = useState(100);
  const [fontSize, setFontSize]         = useState(11);
  const [isOffline, setIsOffline]       = useState(false);
  const [onlineUsers, setOnlineUsers]   = useState([]);
  const colorIndexRef                   = useRef(0);

  const [showComments, setShowComments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [comments, setComments]         = useState([]);

  // Link popup state
  const [linkPopup, setLinkPopup]       = useState({ visible: false, x: 0, y: 0, value: "" });
  const linkInputRef                    = useRef(null);
  const linkPopupRef                    = useRef(null);
  const savedRangeRef                   = useRef(null);

  const nextColor = () => {
    const c = CURSOR_COLORS[colorIndexRef.current % CURSOR_COLORS.length];
    colorIndexRef.current += 1;
    return c;
  };

  const handleUndo = () => quillInstance.current?.history.undo();
  const handleRedo = () => quillInstance.current?.history.redo();

  const changeFontSize = (step) => {
    const range = quillInstance.current?.getSelection();
    let current = fontSize;
    if (range) {
      const fmt = quillInstance.current.getFormat(range);
      if (fmt.size) current = parseInt(fmt.size);
    }
    const next = Math.max(1, Math.min(100, current + step));
    setFontSize(next);
    quillInstance.current?.format("size", `${next}px`);
  };

  const getOrCreateCursorEl = useCallback((userId, name, color) => {
    if (cursorMapRef.current[userId]) return cursorMapRef.current[userId].el;
    if (!cursorLayerRef.current) return null;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:absolute;pointer-events:none;z-index:10;";

    const caret = document.createElement("div");
    caret.style.cssText = `width:2px;height:20px;background:${color};position:absolute;top:0;left:0;`;

    const label = document.createElement("div");
    label.textContent = name;
    label.style.cssText = `background:${color};color:#fff;font-size:11px;padding:1px 5px;border-radius:0 3px 3px 3px;white-space:nowrap;position:absolute;top:-18px;left:0;`;

    wrapper.appendChild(caret);
    wrapper.appendChild(label);
    cursorLayerRef.current.appendChild(wrapper);
    cursorMapRef.current[userId] = { el: wrapper, color };
    return wrapper;
  }, []);

  const moveCursor = useCallback((userId, name, range) => {
    if (!quillInstance.current || !range) return;
    const color = cursorMapRef.current[userId]?.color || nextColor();
    const el    = getOrCreateCursorEl(userId, name, color);
    if (!el) return;
    try {
      const bounds = quillInstance.current.getBounds(range.index, range.length);
      el.style.left    = `${bounds.left}px`;
      el.style.top     = `${bounds.top}px`;
      el.style.display = "block";
    } catch (_) {}
  }, [getOrCreateCursorEl]);

  const removeCursor = useCallback((userId) => {
    const entry = cursorMapRef.current[userId];
    if (entry) { entry.el.remove(); delete cursorMapRef.current[userId]; }
  }, []);

  // Open inline link popup positioned near the toolbar link button
  const openLinkPopup = useCallback(() => {
    const quill = quillInstance.current;
    if (!quill) return;

    const range = quill.getSelection();
    if (!range || range.length === 0) {
      // No text selected — show a brief notice
      return;
    }

    // Save the range so we can apply the link after the input steals focus
    savedRangeRef.current = range;

    // Check if a link already exists on the selection
    const fmt = quill.getFormat(range);
    const existingHref = fmt.link || "";

    // Position popup below the toolbar link button
    const linkBtn = document.querySelector(".ql-link");
    let x = window.innerWidth / 2 - 160;
    let y = 130;
    if (linkBtn) {
      const rect = linkBtn.getBoundingClientRect();
      x = rect.left;
      y = rect.bottom + 6;
    }

    setLinkPopup({ visible: true, x, y, value: existingHref });
    // Focus the input after render
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, []);

  const applyLink = useCallback(() => {
    const quill = quillInstance.current;
    if (!quill || !savedRangeRef.current) return;

    const href = linkPopup.value.trim();
    // Re-select the saved range
    quill.setSelection(savedRangeRef.current);
    if (href) {
      const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
      quill.format("link", url);
    } else {
      quill.format("link", false);
    }
    setLinkPopup({ visible: false, x: 0, y: 0, value: "" });
    savedRangeRef.current = null;
  }, [linkPopup.value]);

  const removeLinkFormat = useCallback(() => {
    const quill = quillInstance.current;
    if (!quill || !savedRangeRef.current) return;
    quill.setSelection(savedRangeRef.current);
    quill.format("link", false);
    setLinkPopup({ visible: false, x: 0, y: 0, value: "" });
    savedRangeRef.current = null;
  }, []);

  const closeLinkPopup = useCallback(() => {
    setLinkPopup({ visible: false, x: 0, y: 0, value: "" });
    savedRangeRef.current = null;
  }, []);

  // Close popup on outside click
  useEffect(() => {
    if (!linkPopup.visible) return;
    const handler = (e) => {
      if (linkPopupRef.current && !linkPopupRef.current.contains(e.target)) {
        closeLinkPopup();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [linkPopup.visible, closeLinkPopup]);

  useEffect(() => {
    if (editorContainerRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorContainerRef.current, {
        theme: "snow",
        modules: {
          toolbar: {
            container: "#toolbar-container",
            handlers: {
              undo: handleUndo,
              redo: handleRedo,
              // Override built-in link handler with our popup
              link: function () {
                openLinkPopup();
              },
            },
          },
          history: { delay: 1000, maxStack: 100, userOnly: true },
        },
      });

      quillInstance.current.on("selection-change", (range) => {
        if (range) {
          const fmt = quillInstance.current.getFormat(range);
          if (fmt.size) setFontSize(parseInt(fmt.size));
        }
        if (socketRef.current && range) {
          socketRef.current.emit("cursor-move", { docId, range });
        }
      });

      quillInstance.current.on("text-change", (delta, _, source) => {
        setEditorHTML(quillInstance.current.root.innerHTML);
        if (source !== "user") return;
        if (socketRef.current) {
          socketRef.current.emit("send-changes", { docId, delta });
        }
      });

      const editorRoot = editorContainerRef.current.querySelector(".ql-editor");
      if (editorRoot) {
        const layer = document.createElement("div");
        layer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;";
        editorRoot.parentElement.style.position = "relative";
        editorRoot.parentElement.appendChild(layer);
        cursorLayerRef.current = layer;
      }
    }

    const initEditor = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/docs/${docId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && quillInstance.current) {
          setDocTitle(res.data.title || "Untitled document");
          if (res.data.content) {
            quillInstance.current.clipboard.dangerouslyPasteHTML(res.data.content);
            setEditorHTML(quillInstance.current.root.innerHTML);
          }
          if (res.data.comments) setComments(res.data.comments);
        }

        socketRef.current = io("http://localhost:5000");

        socketRef.current.on("connect", () => {
          setIsOffline(false);
          socketRef.current.emit("join-document", { docId, token });
        });
        socketRef.current.on("disconnect", () => setIsOffline(true));
        socketRef.current.on("reconnect", () => {
          setIsOffline(false);
          const t = localStorage.getItem("token");
          socketRef.current.emit("join-document", { docId, token: t });
        });
        socketRef.current.on("load-document", (content) => {
          if (content && quillInstance.current) {
            quillInstance.current.clipboard.dangerouslyPasteHTML(content);
            setEditorHTML(quillInstance.current.root.innerHTML);
          }
        });
        socketRef.current.on("receive-changes", (delta) => {
          quillInstance.current?.updateContents(delta);
        });
        socketRef.current.on("user-joined", ({ name, id }) => {
          const color = nextColor();
          setOnlineUsers((prev) => {
            if (prev.find((u) => u.id === id)) return prev;
            return [...prev, { id, name, color }];
          });
        });
        socketRef.current.on("user-left", (userId) => {
          setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
          removeCursor(userId);
        });
        socketRef.current.on("receive-cursor", ({ userId, name, range }) => {
          moveCursor(userId, name, range);
        });
        socketRef.current.on("receive-comment", (comment) => {
          setComments((prev) => {
            if (prev.find((c) => c._id === comment._id)) return prev;
            return [...prev, comment];
          });
        });
        socketRef.current.on("receive-reply", ({ commentId, reply }) => {
          setComments((prev) =>
            prev.map((c) =>
              c._id === commentId
                ? { ...c, replies: [...(c.replies || []), reply] }
                : c
            )
          );
        });
      } catch (err) {
        console.error("Editor init error:", err);
      }
    };

    const timer = setTimeout(initEditor, 100);
    return () => {
      clearTimeout(timer);
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, [docId]);

  const handleSaveToDB = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/docs/${docId}`,
        { title: docTitle, content: quillInstance.current.root.innerHTML },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Document Saved!");
    } catch { alert("❌ Save failed!"); }
  };

  const handleAddComment = (commentData) => {
    if (!socketRef.current) return;
    socketRef.current.emit("new-comment", { docId, comment: commentData });
  };

  const handleAddReply = (commentId, replyData) => {
    if (!socketRef.current) return;
    socketRef.current.emit("reply-comment", { docId, commentId, reply: replyData });
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen flex flex-col">
      <EditorNavbar
        docId={docId}
        docTitle={docTitle}
        setDocTitle={setDocTitle}
        content={editorHTML}
        onSave={handleSaveToDB}
        onToggleComments={() => { setShowComments((v) => !v); setShowVersions(false); }}
        onToggleVersions={() => { setShowVersions((v) => !v); setShowComments(false); }}
        showComments={showComments}
        showVersions={showVersions}
        onlineUsers={onlineUsers}
      />
      {isOffline && (
        <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 text-center text-xs py-1.5 px-4 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          Connection lost — changes may not be synced. Reconnecting…
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#f8f9fa] py-2 flex justify-center border-b border-gray-200 shadow-sm">
        <div className="flex items-center bg-white rounded-full border border-gray-200 px-1 overflow-visible">

          {/* Zoom selector */}
          <div className="flex items-center px-3 border-r border-gray-200 h-9">
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{
                appearance: "auto",
                WebkitAppearance: "auto",
                MozAppearance: "auto",
                color: "#3c4043",
                backgroundColor: "#ffffff",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                fontSize: "13px",
                fontFamily: "inherit",
                height: "28px",
                width: "72px",
                padding: "0 4px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {ZOOM_OPTIONS.map((z) => (
                <option key={z} value={z} style={{ color: "#3c4043", backgroundColor: "#fff" }}>
                  {z}%
                </option>
              ))}
            </select>
          </div>

          <div
            id="toolbar-container"
            className="ql-toolbar-custom flex items-center px-2 overflow-visible"
          >
            {/* Undo / Redo */}
            <span className="ql-formats">
              <button className="ql-undo" title="Undo">↶</button>
              <button className="ql-redo" title="Redo">↷</button>
            </span>

            {/* Heading / Font / Size */}
            <span className="ql-formats border-l pl-2 flex items-center gap-2">
              <select className="ql-header" />
              <select className="ql-font" />
              {/* Font size stepper */}
              <div className="flex items-center bg-white border border-gray-300 rounded px-1 h-7">
                <button
                  type="button"
                  onClick={() => changeFontSize(-2)}
                  className="px-1 font-bold text-gray-600 hover:bg-gray-100 rounded"
                >−</button>
                <input
                  type="text"
                  value={fontSize}
                  readOnly
                  className="w-8 text-center text-xs font-bold outline-none border-x border-gray-100 mx-1"
                />
                <button
                  type="button"
                  onClick={() => changeFontSize(2)}
                  className="px-1 font-bold text-gray-600 hover:bg-gray-100 rounded"
                >+</button>
              </div>
            </span>

            {/* Bold / Italic / Underline */}
            <span className="ql-formats border-l pl-2">
              <button className="ql-bold" />
              <button className="ql-italic" />
              <button className="ql-underline" />
            </span>

            {/* Colors */}
            <span className="ql-formats border-l pl-2">
              <select className="ql-color" />
              <select className="ql-background" />
            </span>

            {/* ── Alignment ─────────────────────────────────────── */}
            <span className="ql-formats border-l pl-2">
              <button className="ql-align" value=""        title="Align Left" />
              <button className="ql-align" value="center"  title="Align Center" />
              <button className="ql-align" value="right"   title="Align Right" />
              <button className="ql-align" value="justify" title="Justify" />
            </span>

            {/* Lists */}
            <span className="ql-formats border-l pl-2">
              <button className="ql-list" value="ordered" title="Ordered List" />
              <button className="ql-list" value="bullet"  title="Bullet List" />
            </span>

            {/* Indent */}
            <span className="ql-formats border-l pl-2">
              <button className="ql-indent" value="-1" title="Decrease Indent" />
              <button className="ql-indent" value="+1" title="Increase Indent" />
            </span>

            {/* Link / Image / Clean */}
            <span className="ql-formats border-l pl-2">
              <button className="ql-link" title="Insert Link" />
              <button className="ql-image" title="Insert Image" />
              <button className="ql-clean" title="Clear Formatting" />
            </span>
          </div>

        </div>
      </div>

      {/* ── Inline Link Popup ────────────────────────────────────────────── */}
      {linkPopup.visible && (
        <div
          ref={linkPopupRef}
          style={{
            position: "fixed",
            top: linkPopup.y,
            left: Math.min(linkPopup.x, window.innerWidth - 340),
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3 w-80 flex flex-col gap-2"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Insert link</p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            {/* Chain-link icon (inline SVG to avoid extra deps) */}
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              ref={linkInputRef}
              type="url"
              placeholder="https://example.com"
              value={linkPopup.value}
              onChange={(e) => setLinkPopup((p) => ({ ...p, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") closeLinkPopup();
              }}
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Remove link button — shown only if a link already exists */}
            {linkPopup.value && (
              <button
                onClick={removeLinkFormat}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition"
              >
                Remove link
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={closeLinkPopup}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applyLink}
                className="px-4 py-1.5 rounded-lg text-xs bg-blue-500 text-white hover:bg-blue-600 transition font-semibold shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document canvas ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex justify-center pb-20 pt-8 bg-[#f8f9fa]">
          <div
            className="bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-gray-200 p-[96px] transition-transform duration-200 origin-top z-10"
            style={{ width: "816px", minHeight: "1056px", transform: `scale(${zoom / 100})` }}
          >
            <div ref={editorContainerRef} style={{ border: "none" }} />
          </div>
        </div>

        {showComments && (
          <CommentsPanel
            comments={comments}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onClose={() => setShowComments(false)}
          />
        )}

        {showVersions && (
          <VersionHistoryPanel
            docId={docId}
            onClose={() => setShowVersions(false)}
            onRestore={(content) => {
              if (quillInstance.current) {
                quillInstance.current.clipboard.dangerouslyPasteHTML(content);
                setEditorHTML(quillInstance.current.root.innerHTML);
              }
            }}
          />
        )}
      </div>

      <style>{`
        /* ── Reset Quill toolbar chrome ─── */
        .ql-toolbar.ql-snow {
          border: none !important;
          background: transparent !important;
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          overflow: visible !important;
          width: fit-content;
          padding: 0 !important;
        }
        .ql-toolbar.ql-snow .ql-formats {
          display: flex !important;
          align-items: center !important;
          margin-right: 6px !important;
          padding-right: 6px;
          border-right: 1px solid #e0e0e0;
          overflow: visible !important;
        }
        .ql-toolbar.ql-snow .ql-formats:last-child { border-right: none; }

        /* ── Quill picker selects (color, header, font) ───── */
        .ql-snow .ql-picker { z-index: 50 !important; }
        .ql-snow .ql-picker-options { z-index: 2000 !important; top: 100% !important; }

        /* ── Alignment active state ─── */
        .ql-align.ql-active svg .ql-stroke { stroke: #1a73e8 !important; }
        .ql-align.ql-active svg .ql-fill   { fill:   #1a73e8 !important; }

        /* ── Editor area ─── */
        .ql-container.ql-snow { border: none !important; }
        .ql-editor { padding: 0 !important; font-size: 16px; outline: none; line-height: 1.6; }
        .ql-editor a { color: #1a73e8 !important; text-decoration: underline !important; }

        /* ── Undo / Redo buttons ──── */
        .ql-undo, .ql-redo { font-size: 18px !important; color: #444; width: 32px !important; }

        /* ── Hide Quill's own link tooltip/bubble ── */
        .ql-tooltip { display: none !important; }
      `}</style>
    </div>
  );
};

export default Editor;