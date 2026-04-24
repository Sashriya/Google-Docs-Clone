import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { MdDescription, MdLock, MdOpenInNew, MdPerson } from "react-icons/md";

const SharedDocumentView = () => {
  const { id } = useParams();
  const navigate  = useNavigate();
  const editorRef = useRef(null);
  const quillRef  = useRef(null);

  const [doc, setDoc]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/docs/shared/${id}`);
        setDoc(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load document.");
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);
  
  useEffect(() => {
    if (!doc || !editorRef.current) return;
    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        readOnly: true,
        modules: { toolbar: false },
      });
    }
    if (doc.content) {
      quillRef.current.clipboard.dangerouslyPasteHTML(doc.content);
    }
  }, [doc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <span className="animate-spin w-8 h-8 border-4 border-[#4285F4] border-t-transparent rounded-full" />
          <p className="text-sm">Loading document…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdLock className="text-red-400 text-3xl" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 bg-[#4285F4] text-white rounded-full text-sm font-semibold hover:bg-[#1a73e8] transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <nav className="bg-white border-b px-6 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <MdDescription className="text-[#4285F4] text-3xl" />
          <div>
            <p className="text-base font-semibold text-gray-800 leading-tight">
              {doc?.title || "Untitled Document"}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MdPerson className="text-xs" />
              Shared document · Read only
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 bg-[#C2E7FF] text-[#001D35] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#B3D9F2] transition"
        >
          <MdOpenInNew className="text-base" />
          Sign in to edit
        </button>
      </nav>
      <div className="bg-[#FFF9C4] border-b border-yellow-200 text-yellow-800 text-xs text-center py-1.5 flex items-center justify-center gap-2 select-none">
        <MdLock className="text-sm" />
        You are viewing a read-only version of this document.
      </div>
      <div className="flex-1 flex justify-center py-10 px-4 overflow-y-auto">
        <div
          className="bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-gray-200 p-[96px] w-full"
          style={{ maxWidth: "816px", minHeight: "1056px" }}
        >
          <div ref={editorRef} />
        </div>
      </div>

      <style>{`
        .ql-container.ql-snow { border: none !important; }
        .ql-editor {
          padding: 0 !important;
          font-size: 16px;
          line-height: 1.6;
          color: #202124;
          cursor: default !important;
        }
        .ql-editor * { cursor: default !important; }
        .ql-editor a { color: #1a73e8 !important; text-decoration: underline !important; }
      `}</style>
    </div>
  );
};

export default SharedDocumentView;