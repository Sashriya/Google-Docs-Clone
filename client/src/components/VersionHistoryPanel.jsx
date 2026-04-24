import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdClose, MdHistory, MdRestorePage, MdExpandMore, MdExpandLess } from "react-icons/md";

const API = "http://localhost:5000/api/docs";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const VersionItem = ({ version, index, total, onRestore }) => {
  const [expanded, setExpanded] = useState(false);
  const label = `Version ${total - index}`;
  const author = version.updatedBy?.name || "Unknown";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MdHistory className="text-[#4285F4] text-base" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-[11px] text-gray-400">
              {formatDate(version.createdAt)} · {author}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onRestore(version.content); }}
            title="Restore this version"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium border border-blue-200"
          >
            <MdRestorePage className="text-sm" /> Restore
          </button>
          {expanded ? <MdExpandLess className="text-gray-400 ml-1" /> : <MdExpandMore className="text-gray-400 ml-1" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <p className="text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Preview</p>
          <div
            className="text-xs text-gray-600 max-h-32 overflow-y-auto prose prose-sm"
            dangerouslySetInnerHTML={{ __html: version.content || "<em>Empty</em>" }}
          />
        </div>
      )}
    </div>
  );
};

const VersionHistoryPanel = ({ docId, onClose, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/${docId}/versions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVersions(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load versions.");
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [docId]);

  const handleRestore = (content) => {
    if (window.confirm("Restore this version? Current unsaved changes will be replaced.")) {
      onRestore(content);
      onClose();
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-[#F8F9FA] border-l border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MdHistory className="text-[#4285F4] text-lg" />
          <span className="text-sm font-semibold text-gray-800">History</span>
          {!loading && versions.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {versions.length}
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

      <p className="text-[11px] text-gray-400 px-4 py-2 border-b border-gray-100 bg-white">
        Versions are saved automatically when you save the document.
      </p>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {loading && (
          <div className="flex justify-center mt-10">
            <span className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full inline-block" />
          </div>
        )}
        {!loading && error && (
          <p className="text-xs text-red-500 text-center mt-6">{error}</p>
        )}
        {!loading && !error && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <MdHistory className="text-3xl opacity-30" />
            <p className="text-xs text-center">No versions yet.<br />Save the document to create one.</p>
          </div>
        )}
        {!loading && !error && [...versions].reverse().map((v, i) => (
          <VersionItem
            key={v._id || i}
            version={v}
            index={i}
            total={versions.length}
            onRestore={handleRestore}
          />
        ))}
      </div>
    </div>
  );
};

export default VersionHistoryPanel;