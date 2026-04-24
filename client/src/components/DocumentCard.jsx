import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdMoreVert,
  MdTextFields,
  MdDeleteOutline,
  MdOpenInNew,
  MdDescription,
  MdStar,
  MdStarOutline,
} from "react-icons/md";

const DocumentCard = ({ doc, onDelete, onRename, onStarToggle }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [starring, setStarring] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => navigate(`/editor/${doc._id}`);

  const handleStarClick = async (e) => {
    e.stopPropagation();
    if (starring) return;
    setStarring(true);
    try {
      await onStarToggle(doc._id);
    } finally {
      setStarring(false);
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={handleCardClick}>
      <div className="h-52 border border-gray-200 rounded-t group-hover:border-blue-400 bg-gray-50 flex items-center justify-center overflow-hidden transition-all relative">
        <MdDescription className="text-blue-500 text-6xl group-hover:scale-110 transition-transform" />
        <button
          onClick={handleStarClick}
          disabled={starring}
          title={doc.isStarred ? "Remove from starred" : "Add to starred"}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
        >
          {doc.isStarred
            ? <MdStar className="text-yellow-400 text-lg" />
            : <MdStarOutline className="text-gray-400 text-lg" />}
        </button>
      </div>
      <div className="p-3 border border-t-0 border-gray-200 rounded-b bg-white relative">
        <h3 className="text-sm font-medium text-gray-800 truncate pr-6">
          {doc.title || "Untitled Document"}
        </h3>

        <div className="flex items-center gap-2 mt-1">
          {doc.isStarred && (
            <MdStar className="text-yellow-400 text-xs flex-shrink-0" />
          )}
          <span className="bg-blue-100 text-[#1a73e8] text-[10px] px-1.5 py-0.5 rounded font-bold">DOCS</span>
          <p className="text-[11px] text-gray-500 italic truncate">
            {new Date(doc.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute bottom-3 right-2 p-1 hover:bg-gray-100 rounded-full transition z-10"
        >
          <MdMoreVert className="text-gray-500 text-xl" />
        </button>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
            />
            <div className="absolute right-0 bottom-12 w-48 bg-white shadow-xl border rounded-lg py-2 z-30 animate-in fade-in zoom-in duration-150">
              <button
                onClick={(e) => { e.stopPropagation(); handleStarClick(e); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700"
              >
                {doc.isStarred
                  ? <MdStar className="text-yellow-400 text-xl" />
                  : <MdStarOutline className="text-xl text-gray-500" />}
                {doc.isStarred ? "Remove from starred" : "Add to starred"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRename(doc._id, doc.title); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700"
              >
                <MdTextFields className="text-xl text-gray-500" /> Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(doc._id); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700"
              >
                <MdDeleteOutline className="text-xl text-gray-500" /> Remove
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(`/editor/${doc._id}`, "_blank"); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700 border-t"
              >
                <MdOpenInNew className="text-xl text-gray-500" /> Open in new tab
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;