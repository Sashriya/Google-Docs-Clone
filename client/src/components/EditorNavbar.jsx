import React, { useState, Fragment, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { Menu, Transition } from "@headlessui/react";
import { AuthContext } from "../context/AuthContext";
import {
  MdDescription,
  MdStarOutline,
  MdStar,
  MdHistory,
  MdComment,
  MdLock,
  MdLockOpen,
  MdArrowDropDown,
  MdLink,
  MdPublic,
  MdSave,
  MdPrint,
  MdContentCopy,
  MdFileDownload,
  MdDeleteOutline,
  MdUndo,
  MdRedo,
  MdFormatSize,
  MdInfoOutline,
  MdClose,
  MdCheck,
  MdPersonAdd,
  MdPeople,
  MdEdit,
  MdPhotoCamera,
  MdPictureAsPdf,
  MdTextSnippet,
  MdWarning,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatClear,
  MdFormatIndentIncrease,
  MdFormatIndentDecrease,
  MdImage,
  MdTableChart,
  MdFullscreen,
  MdSpellcheck,
  MdOutlineCalculate,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ProfileEditModal from "./ProfileEditModal";

const API = "http://localhost:5000/api/docs";

/* ─── Online user avatar ─────────────────────────────────────────── */
const OnlineAvatar = ({ user }) => {
  const colors = ["#e53935","#8e24aa","#1e88e5","#00897b","#f4511e","#6d4c41","#3949ab","#039be5"];
  const bg = user.color || colors[user.name.charCodeAt(0) % colors.length];
  return (
    <div
      title={user.name}
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white -ml-1.5 first:ml-0 shadow-sm flex-shrink-0"
      style={{ background: bg }}
    >
      {user.name?.charAt(0).toUpperCase()}
    </div>
  );
};

/* ─── Word Count Modal ───────────────────────────────────────────── */
const WordCountModal = ({ content, onClose }) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = content || "";
  const text = tmp.innerText.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const paragraphs = text ? text.split(/\n+/).filter(Boolean).length : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[600]">
      <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">Word count</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <MdClose className="text-xl text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            ["Words", words],
            ["Characters (with spaces)", chars],
            ["Characters (no spaces)", charsNoSpace],
            ["Paragraphs", paragraphs],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-bold text-gray-800">{val.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-full bg-[#4285F4] text-white text-sm font-semibold hover:bg-[#1a73e8] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Delete Confirm Modal ───────────────────────────────────────── */
const DeleteModal = ({ docTitle, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[600]">
    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-base font-semibold text-gray-800">Move to trash?</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
          <MdClose className="text-xl text-gray-500" />
        </button>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-600">
          "<span className="font-medium text-gray-800">{docTitle}</span>" will be moved to trash. You can restore it later.
        </p>
      </div>
      <div className="px-6 pb-4 flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-100 transition font-medium">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-5 py-2 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition shadow-sm">
          Move to trash
        </button>
      </div>
    </div>
  </div>
);

/* ─── Docs Help Modal ────────────────────────────────────────────── */
const HelpModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[600]">
    <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
        <h2 className="text-base font-semibold text-gray-800">Keyboard shortcuts & help</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
          <MdClose className="text-xl text-gray-500" />
        </button>
      </div>
      <div className="px-6 py-5 space-y-5">
        {[
          {
            title: "File",
            items: [["Save", "Ctrl + S"], ["Print", "Ctrl + P"], ["Download as PDF", "—"]],
          },
          {
            title: "Edit",
            items: [["Undo", "Ctrl + Z"], ["Redo", "Ctrl + Y"], ["Copy", "Ctrl + C"], ["Paste", "Ctrl + V"], ["Select all", "Ctrl + A"]],
          },
          {
            title: "Format",
            items: [["Bold", "Ctrl + B"], ["Italic", "Ctrl + I"], ["Underline", "Ctrl + U"], ["Insert link", "Ctrl + K"], ["Clear formatting", "Ctrl + \\"]],
          },
          {
            title: "View",
            items: [["Full screen", "F11"], ["Zoom in", "Ctrl + +"], ["Zoom out", "Ctrl + −"]],
          },
        ].map(({ title, items }) => (
          <div key={title}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
            <div className="space-y-1.5">
              {items.map(([label, shortcut]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{label}</span>
                  <kbd className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{shortcut}</kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   EditorNavbar
═══════════════════════════════════════════════════════════════════ */
const EditorNavbar = ({
  docId,
  docTitle,
  setDocTitle,
  content,
  onSave,
  onToggleComments,
  onToggleVersions,
  showComments,
  showVersions,
  onlineUsers = [],
  quillRef,           // optional: pass quillInstance ref for Edit/Format actions
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ── basic state ─────────────────────────────────── */
  const [isStarred, setIsStarred]           = useState(false);
  const [isPublic, setIsPublic]             = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [copyStatus, setCopyStatus]         = useState("Copy link");

  /* ── share modal ─────────────────────────────────── */
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab]           = useState("people");
  const [shareEmail, setShareEmail]         = useState("");
  const [shareRole, setShareRole]           = useState("viewer");
  const [emailError, setEmailError]         = useState("");
  const [shareSuccess, setShareSuccess]     = useState("");
  const [isSharing, setIsSharing]           = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [sharedLink, setSharedLink]         = useState("");

  /* ── profile ─────────────────────────────────────── */
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);

  /* ── modals ──────────────────────────────────────── */
  const [showWordCount, setShowWordCount]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHelpModal, setShowHelpModal]   = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);

  const avatarSrc      = user?.profilePic;
  const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || "U";

  /* ── fetch doc state on mount ────────────────────── */
  useEffect(() => {
    const fetchDocState = async () => {
      try {
        const res = await axios.get(`${API}/${docId}`, { headers });
        setIsStarred(res.data.isStarred || false);
        setIsPublic(res.data.isPublic || false);
      } catch (err) {
        console.error("Failed to fetch doc state:", err);
      }
    };
    if (docId) fetchDocState();
  }, [docId]);

  /* ── close share dropdown on outside click ───────── */
  useEffect(() => {
    if (!showShareDropdown) return;
    const close = () => setShowShareDropdown(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showShareDropdown]);

  /* ── fullscreen change listener ──────────────────── */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ── keyboard shortcut: Ctrl+S ───────────────────── */
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [docTitle]);

  /* ─── helpers ──────────────────────────────────────────────────── */
  const handleStarToggle = async () => {
    try {
      const res = await axios.patch(`${API}/${docId}/star`, {}, { headers });
      setIsStarred(res.data.isStarred);
    } catch (err) { console.error("Star error", err); }
  };

  const handleDownloadTxt = () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = content;
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([tmp.innerText], { type: "text/plain" }));
    el.download = `${docTitle}.txt`;
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`${API}/${docId}/export?format=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("PDF download failed");
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docTitle || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleManualSave = () => {
    if (!docTitle?.trim()) { alert("⚠️ Document title cannot be empty!"); return; }
    onSave();
  };

  const handlePrint = () => window.print();

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API}/${docId}`, { headers });
      setShowDeleteModal(false);
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to delete document.");
      console.error(err);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleCopyLink = async (e) => {
    e?.stopPropagation();
    if (!isPublic) {
      alert("⚠️ This document is private.\n\nPlease open Share → 'Link access' tab and enable 'Anyone with the link' before sharing.");
      setShowShareDropdown(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/${docId}/share-link`, { headers });
      const link = res.data.sharedUrl;
      setSharedLink(link);
      await navigator.clipboard.writeText(link);
    } catch {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus("Copy link"), 2500);
    setShowShareDropdown(false);
  };

  const handleTogglePublic = async (newValue) => {
    setIsTogglingPublic(true);
    setEmailError("");
    try {
      const res = await axios.patch(`${API}/${docId}/public-access`, { isPublic: newValue }, { headers });
      setIsPublic(res.data.isPublic);
      if (res.data.isPublic) {
        try {
          const linkRes = await axios.get(`${API}/${docId}/share-link`, { headers });
          setSharedLink(linkRes.data.sharedUrl);
        } catch (_) {}
      }
    } catch (err) {
      setEmailError(err.response?.data?.message || "Failed to update access.");
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleShareSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shareEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setIsSharing(true);
    try {
      const res = await axios.post(`${API}/${docId}/share`, { email: shareEmail, role: shareRole }, { headers });
      setShareSuccess(res.data.message || `Shared with ${shareEmail} as ${shareRole}.`);
      setShareEmail("");
    } catch (err) {
      setEmailError(err.response?.data?.message || "Sharing failed. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const openShareModal = async (tab = "people") => {
    setActiveTab(tab);
    setShareEmail(""); setEmailError(""); setShareSuccess("");
    setShowShareDropdown(false);
    setShowShareModal(true);
    try {
      const res = await axios.get(`${API}/${docId}/share-link`, { headers });
      setSharedLink(res.data.sharedUrl);
    } catch {
      setSharedLink(window.location.href);
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareEmail(""); setEmailError(""); setShareSuccess("");
  };

  /* ── quill helper (uses optional quillRef prop) ──── */
  const getQuill = () => quillRef?.current ?? null;

  const quillAction = (fn) => {
    const q = getQuill();
    if (q) fn(q);
  };

  /* ─── MenuDropdown ─────────────────────────────────────────────── */
  const MenuDropdown = ({ label, items }) => (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded transition focus:outline-none">
        {label}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-1 w-60 origin-top-left bg-white divide-y divide-gray-100 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
          <div className="px-1 py-1">
            {items.map((item, i) =>
              item.divider ? (
                <div key={i} className="border-t my-1" />
              ) : (
                <Menu.Item key={i}>
                  {({ active }) => (
                    <button
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className={`${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""} group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon className="text-lg text-gray-500 flex-shrink-0" />}
                        <span>{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <kbd className="text-xs text-gray-400 font-mono">{item.shortcut}</kbd>
                      )}
                    </button>
                  )}
                </Menu.Item>
              )
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  /* ─── menu definitions ─────────────────────────────────────────── */
  const fileMenuItems = [
    { label: "Save", icon: MdSave, shortcut: "Ctrl+S", onClick: handleManualSave },
    { divider: true },
    { label: "Download as TXT", icon: MdTextSnippet, onClick: handleDownloadTxt },
    { label: "Download as PDF", icon: MdPictureAsPdf, onClick: handleDownloadPdf },
    { divider: true },
    { label: "Print", icon: MdPrint, shortcut: "Ctrl+P", onClick: handlePrint },
    { divider: true },
    { label: "Move to trash", icon: MdDeleteOutline, onClick: () => setShowDeleteModal(true) },
  ];

  const editMenuItems = [
    {
      label: "Undo", icon: MdUndo, shortcut: "Ctrl+Z",
      onClick: () => quillAction((q) => q.history?.undo()),
    },
    {
      label: "Redo", icon: MdRedo, shortcut: "Ctrl+Y",
      onClick: () => quillAction((q) => q.history?.redo()),
    },
    { divider: true },
    {
      label: "Copy", icon: MdContentCopy, shortcut: "Ctrl+C",
      onClick: () => document.execCommand("copy"),
    },
    {
      label: "Cut", shortcut: "Ctrl+X",
      onClick: () => document.execCommand("cut"),
    },
    {
      label: "Paste", shortcut: "Ctrl+V",
      onClick: () => document.execCommand("paste"),
    },
    { divider: true },
    {
      label: "Select all", shortcut: "Ctrl+A",
      onClick: () => quillAction((q) => q.setSelection(0, q.getLength())),
    },
  ];

  const viewMenuItems = [
    {
      label: isFullscreen ? "Exit full screen" : "Full screen",
      icon: MdFullscreen,
      shortcut: "F11",
      onClick: handleToggleFullscreen,
    },
    { divider: true },
    {
      label: "Word count",
      icon: MdOutlineCalculate,
      onClick: () => setShowWordCount(true),
    },
  ];

  const insertMenuItems = [
    {
      label: "Image",
      icon: MdImage,
      onClick: () => {
        // Trigger quill's image handler
        const btn = document.querySelector(".ql-image");
        if (btn) btn.click();
      },
    },
    {
      label: "Link",
      icon: MdLink,
      shortcut: "Ctrl+K",
      onClick: () => {
        const btn = document.querySelector(".ql-link");
        if (btn) btn.click();
      },
    },
    { divider: true },
    {
      label: "Ordered list",
      icon: MdFormatListNumbered,
      onClick: () => quillAction((q) => q.format("list", "ordered")),
    },
    {
      label: "Bullet list",
      icon: MdFormatListBulleted,
      onClick: () => quillAction((q) => q.format("list", "bullet")),
    },
  ];

  const formatMenuItems = [
    {
      label: "Bold",
      icon: MdFormatBold,
      shortcut: "Ctrl+B",
      onClick: () => quillAction((q) => {
        const range = q.getSelection(true);
        const fmt   = q.getFormat(range);
        q.format("bold", !fmt.bold);
      }),
    },
    {
      label: "Italic",
      icon: MdFormatItalic,
      shortcut: "Ctrl+I",
      onClick: () => quillAction((q) => {
        const range = q.getSelection(true);
        const fmt   = q.getFormat(range);
        q.format("italic", !fmt.italic);
      }),
    },
    {
      label: "Underline",
      icon: MdFormatUnderlined,
      shortcut: "Ctrl+U",
      onClick: () => quillAction((q) => {
        const range = q.getSelection(true);
        const fmt   = q.getFormat(range);
        q.format("underline", !fmt.underline);
      }),
    },
    { divider: true },
    {
      label: "Align left",
      icon: MdFormatAlignLeft,
      onClick: () => quillAction((q) => q.format("align", "")),
    },
    {
      label: "Align center",
      icon: MdFormatAlignCenter,
      onClick: () => quillAction((q) => q.format("align", "center")),
    },
    {
      label: "Align right",
      icon: MdFormatAlignRight,
      onClick: () => quillAction((q) => q.format("align", "right")),
    },
    {
      label: "Justify",
      icon: MdFormatAlignJustify,
      onClick: () => quillAction((q) => q.format("align", "justify")),
    },
    { divider: true },
    {
      label: "Increase indent",
      icon: MdFormatIndentIncrease,
      onClick: () => quillAction((q) => {
        const range = q.getSelection(true);
        const fmt   = q.getFormat(range);
        q.format("indent", (fmt.indent || 0) + 1);
      }),
    },
    {
      label: "Decrease indent",
      icon: MdFormatIndentDecrease,
      onClick: () => quillAction((q) => {
        const range = q.getSelection(true);
        const fmt   = q.getFormat(range);
        q.format("indent", Math.max(0, (fmt.indent || 0) - 1) || false);
      }),
    },
    { divider: true },
    {
      label: "Clear formatting",
      icon: MdFormatClear,
      shortcut: "Ctrl+\\",
      onClick: () => {
        const btn = document.querySelector(".ql-clean");
        if (btn) btn.click();
      },
    },
  ];

  const toolsMenuItems = [
    {
      label: "Word count",
      icon: MdOutlineCalculate,
      onClick: () => setShowWordCount(true),
    },
    {
      label: "Spell check",
      icon: MdSpellcheck,
      onClick: () => alert("Spell check is handled by your browser's built-in spell checker."),
    },
  ];

  const helpMenuItems = [
    {
      label: "Keyboard shortcuts",
      icon: MdInfoOutline,
      onClick: () => setShowHelpModal(true),
    },
  ];

  /* ─── render ──────────────────────────────────────────────────── */
  return (
    <>
      <nav className="bg-[#F9FBFD] px-4 py-1 flex flex-col border-b sticky top-0 z-50 select-none shadow-sm">
        <div className="flex items-center justify-between">

          {/* ── Left: logo + title + menus ─── */}
          <div className="flex items-center gap-3">
            <MdDescription
              className="text-[#4285F4] text-4xl cursor-pointer hover:opacity-80 transition"
              onClick={() => navigate("/dashboard")}
            />
            <div className="flex flex-col">
              {/* Title row */}
              <div className="flex items-center gap-2">
                <input
                  className="bg-transparent text-lg font-medium outline-none border-b border-transparent focus:border-blue-500 transition-all px-1 max-w-[300px]"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
                <button
                  onClick={handleManualSave}
                  className="p-1 hover:bg-blue-50 rounded text-blue-600"
                  title="Save (Ctrl+S)"
                >
                  <MdSave className="text-xl" />
                </button>
                <button onClick={handleStarToggle} className="p-1 hover:bg-gray-100 rounded">
                  {isStarred
                    ? <MdStar className="text-yellow-500 text-xl" />
                    : <MdStarOutline className="text-gray-500 text-xl" />}
                </button>
              </div>

              {/* Menu bar */}
              <div className="flex gap-0.5 -ml-1 flex-wrap">
                <MenuDropdown label="File"   items={fileMenuItems}   />
                <MenuDropdown label="Edit"   items={editMenuItems}   />
                <MenuDropdown label="View"   items={viewMenuItems}   />
                <MenuDropdown label="Insert" items={insertMenuItems} />
                <MenuDropdown label="Format" items={formatMenuItems} />
                <MenuDropdown label="Tools"  items={toolsMenuItems}  />
                <MenuDropdown label="Help"   items={helpMenuItems}   />
              </div>
            </div>
          </div>

          {/* ── Right: online users + actions + share + avatar ─── */}
          <div className="flex items-center gap-3">

            {/* Online users */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center mr-1">
                {onlineUsers.slice(0, 5).map((u) => (
                  <OnlineAvatar key={u.id} user={u} />
                ))}
                {onlineUsers.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600 -ml-1.5 border-2 border-white">
                    +{onlineUsers.length - 5}
                  </div>
                )}
              </div>
            )}

            {/* Version history */}
            <button
              onClick={onToggleVersions}
              title="Version History"
              className={`p-1.5 rounded transition ${showVersions ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-200"}`}
            >
              <MdHistory className="text-xl" />
            </button>

            {/* Comments */}
            <button
              onClick={onToggleComments}
              title="Comments"
              className={`p-1.5 rounded transition ${showComments ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-200"}`}
            >
              <MdComment className="text-xl" />
            </button>

            <div className="relative inline-flex items-center">
              <button
                onClick={() => openShareModal("people")}
                className="bg-[#C2E7FF] text-[#001D35] px-5 py-2 rounded-l-full flex items-center gap-2 font-semibold hover:bg-[#B3D9F2] transition text-sm"
              >
                {isPublic ? <MdLockOpen className="text-lg" /> : <MdLock className="text-lg" />}
                Share
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowShareDropdown((v) => !v); }}
                className="bg-[#C2E7FF] border-l border-[#A8C7FA] px-1 py-2 rounded-r-full hover:bg-[#B3D9F2] transition"
              >
                <MdArrowDropDown className="text-xl" />
              </button>

              {showShareDropdown && (
                <div className="absolute top-11 right-0 w-64 bg-white shadow-xl rounded-xl border border-gray-200 py-2 z-[200]">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-gray-700 text-sm"
                  >
                    {copyStatus === "Copied!"
                      ? <MdCheck className="text-xl text-green-500" />
                      : isPublic
                        ? <MdLink className="text-xl" />
                        : <MdWarning className="text-xl text-yellow-500" />}
                    <span className={copyStatus === "Copied!" ? "text-green-600 font-medium" : ""}>
                      {copyStatus}
                    </span>
                  </button>
                  {!isPublic && (
                    <p className="px-4 pb-1 text-[11px] text-yellow-600">
                      Document is private — enable link access first
                    </p>
                  )}
                  <div className="border-t my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); openShareModal("link"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700"
                  >
                    <MdPublic className="text-xl" />
                    <div className="flex flex-col items-start">
                      <span>Anyone with link</span>
                      <span className="text-xs text-gray-400">
                        {isPublic ? "Currently: Public" : "Currently: Restricted"}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <div
                className="relative group w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-[#4285F4] transition-all cursor-pointer bg-blue-50 flex items-center justify-center shadow-sm"
                onClick={() => setShowProfileMenu((v) => !v)}
              >
                {avatarSrc
                  ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-[#4285F4] font-bold text-sm">{avatarFallback}</span>}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <MdPhotoCamera className="text-white text-xs" />
                </div>
              </div>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-br from-[#F0F4FF] to-white border-b flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#C2E7FF] flex-shrink-0 bg-blue-50 flex items-center justify-center">
                        {avatarSrc
                          ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                          : <span className="text-[#4285F4] font-bold text-sm">{avatarFallback}</span>}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setShowProfileMenu(false); setShowEditModal(true); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition"
                      >
                        <MdEdit className="text-[#4285F4] text-lg" /> Edit Profile
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[500]"
          onClick={(e) => e.target === e.currentTarget && closeShareModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-800 truncate">Share "{docTitle}"</h2>
              <button onClick={closeShareModal} className="p-1 hover:bg-gray-100 rounded-full transition">
                <MdClose className="text-xl text-gray-500" />
              </button>
            </div>

            <div className="flex border-b">
              {[
                { key: "people", icon: MdPersonAdd, label: "Add people" },
                { key: "link",   icon: MdPublic,    label: "Link access" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setEmailError(""); setShareSuccess(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 ${
                    activeTab === key
                      ? "border-[#4285F4] text-[#4285F4]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="text-lg" />{label}
                </button>
              ))}
            </div>

            {activeTab === "people" && (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Collaborator email</label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => { setShareEmail(e.target.value); setEmailError(""); setShareSuccess(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleShareSubmit()}
                    placeholder="colleague@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      emailError
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-gray-300 focus:border-[#4285F4] focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {emailError  && <p className="text-xs text-red-500 mt-1.5">{emailError}</p>}
                  {shareSuccess && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <MdCheck className="text-sm" />{shareSuccess}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Permission</label>
                  <div className="flex gap-2">
                    {["viewer", "editor"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setShareRole(role)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize border transition-all ${
                          shareRole === role
                            ? "bg-[#C2E7FF] border-[#4285F4] text-[#001D35]"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {shareRole === "editor" ? "Can edit and save the document." : "Can view but not edit."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "link" && (
              <div className="px-6 py-5 space-y-4">
                {!isPublic && (
                  <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                    <MdWarning className="text-yellow-500 text-lg flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 leading-relaxed">
                      This document is <strong>private</strong>. Toggle the switch below to let anyone with the link view it.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border">
                  <div className="flex items-center gap-3">
                    <MdPublic className="text-gray-500 text-xl" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Anyone with the link</p>
                      <p className="text-xs text-gray-500">
                        {isPublic ? "✓ Anyone can view this document" : "Only invited people can access"}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isTogglingPublic}
                    onClick={() => handleTogglePublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      isPublic ? "bg-[#4285F4]" : "bg-gray-300"
                    } ${isTogglingPublic ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${isPublic ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Shareable link</label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={isPublic ? sharedLink || "Generating link…" : "Enable public access to get a link"}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none truncate transition-all ${
                        isPublic
                          ? "border-gray-200 bg-gray-50 text-gray-600"
                          : "border-gray-100 bg-gray-50 text-gray-400 italic"
                      }`}
                    />
                    <button
                      onClick={handleCopyLink}
                      disabled={!isPublic}
                      className="px-3 py-2 rounded-xl bg-[#C2E7FF] text-[#001D35] text-xs font-semibold hover:bg-[#B3D9F2] transition flex items-center gap-1 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {copyStatus === "Copied!" ? <MdCheck className="text-green-600" /> : <MdLink />}
                      {copyStatus}
                    </button>
                  </div>
                  {isPublic && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <MdCheck className="text-sm" /> Link is active — anyone with this link can view
                    </p>
                  )}
                </div>
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>
            )}

            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-2">
              <button
                onClick={closeShareModal}
                className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              {activeTab === "people" && (
                <button
                  onClick={handleShareSubmit}
                  disabled={isSharing}
                  className="px-5 py-2 bg-[#4285F4] text-white rounded-full text-sm font-semibold hover:bg-[#1a73e8] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSharing ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      Sending…
                    </>
                  ) : (
                    <><MdPeople className="text-base" />Send invite</>
                  )}
                </button>
              )}
              {activeTab === "link" && (
                <button
                  onClick={closeShareModal}
                  className="px-5 py-2 bg-[#4285F4] text-white rounded-full text-sm font-semibold hover:bg-[#1a73e8] transition shadow-sm"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showWordCount && (
        <WordCountModal content={content} onClose={() => setShowWordCount(false)} />
      )}

      {showDeleteModal && (
        <DeleteModal
          docTitle={docTitle}
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      
      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}
      
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
};

export default EditorNavbar;