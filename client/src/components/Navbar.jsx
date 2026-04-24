import React, { useContext, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MdLogout, MdPhotoCamera, MdEdit } from "react-icons/md";
import ProfileEditModal from "./ProfileEditModal";

const Navbar = () => {
  const { logout, searchTerm, setSearchTerm, user, uploadProfilePic } = useContext(AuthContext);
  const navigate      = useNavigate();
  const fileInputRef  = useRef(null);
  const [showMenu, setShowMenu]           = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const res = await uploadProfilePic(file);
      if (res?.success) alert("Profile Picture Updated!");
    }
  };

  const avatarSrc      = user?.profilePic;
  const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-2 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <img
            src="https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png"
            alt="Docs Logo"
            className="w-10 h-10"
          />
          <span className="text-xl font-medium text-gray-700">Docs Clone</span>
        </div>
        <div className="flex-1 max-w-2xl mx-10">
          <div className="relative flex items-center bg-gray-100 px-4 py-2 rounded-lg focus-within:bg-white focus-within:shadow-md transition">
            <span className="text-gray-500 mr-3">🔍</span>
            <input
              type="text"
              placeholder="Search documents..."
              className="bg-transparent outline-none w-full text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="relative group cursor-pointer w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#4285F4] transition-all shadow-sm bg-blue-50 flex items-center justify-center"
              onClick={() => setShowMenu((v) => !v)}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#4285F4] font-bold text-lg">{avatarFallback}</span>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <MdPhotoCamera className="text-white text-sm" />
              </div>
            </div>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 bg-gradient-to-br from-[#F0F4FF] to-white border-b flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C2E7FF] flex-shrink-0 bg-blue-50 flex items-center justify-center">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#4285F4] font-bold">{avatarFallback}</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition"
                    >
                      <MdEdit className="text-[#4285F4] text-lg" /> Edit Profile
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); fileInputRef.current.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition"
                    >
                      <MdPhotoCamera className="text-[#4285F4] text-lg" /> Change Photo
                    </button>
                    <div className="border-t my-1" />
                    <button
                      onClick={() => { logout(); navigate("/login"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500 transition"
                    >
                      <MdLogout className="text-lg" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </nav>

      <ProfileEditModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
    </>
  );
};

export default Navbar;