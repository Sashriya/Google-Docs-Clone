import React, { useState, useRef, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import {
  MdClose,
  MdPhotoCamera,
  MdPerson,
  MdEmail,
  MdCheck,
  MdEdit,
  MdSave,
  MdErrorOutline,
} from "react-icons/md";

const ProfileEditModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "");
      setPreview(null);
      setSelectedFile(null);
      setError("");
      setSuccessMsg("");
    }
  }, [isOpen, user]);

  if (!isOpen) return null;
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = ""; 
    setSelectedFile(file);
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };
  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    setError("");
    setSaving(true);
    setSuccessMsg("");

    try {
      let updatedUser = { ...user };
      if (selectedFile) {
        const formData = new FormData();
        formData.append("profilePic", selectedFile);

        const picRes = await axios.post(
          "http://localhost:5000/api/docs/upload-profile",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        updatedUser = {
          ...updatedUser,
          profilePic: picRes.data.profilePic,
        };
      }
      
      if (name.trim() !== user.name) {
        const nameRes = await axios.patch(
          "http://localhost:5000/api/auth/update-profile",
          { name: name.trim() },
          { headers },
        );
        updatedUser = { ...updatedUser, name: nameRes.data.name };
      }
      
      setUser(updatedUser);

      setSuccessMsg("Profile updated successfully!");
      setSelectedFile(null);
      setPreview(null);
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1400);
    } catch (err) {
      console.error("Profile save error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Update failed. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = preview || user?.profilePic;
  const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600]"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#F0F4FF] to-[#F9FBFD]">
          <div className="flex items-center gap-2">
            <MdPerson className="text-[#4285F4] text-xl" />
            <h2 className="text-sm font-semibold text-gray-800">
              Edit Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-gray-200 rounded-full transition disabled:opacity-40"
          >
            <MdClose className="text-gray-500 text-lg" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative group cursor-pointer"
              onClick={() => !saving && fileInputRef.current.click()}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#C2E7FF] shadow-md bg-blue-50 flex items-center justify-center select-none">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#4285F4] font-bold text-3xl">
                    {avatarFallback}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <MdPhotoCamera className="text-white text-2xl" />
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#4285F4] rounded-full flex items-center justify-center border-2 border-white shadow pointer-events-none">
                <MdEdit className="text-white text-xs" />
              </div>
            </div>

            <p className="text-xs text-gray-400">Click to change photo</p>

            {preview && (
              <span className="text-xs bg-blue-50 text-[#4285F4] border border-blue-100 px-3 py-1 rounded-full font-medium">
                ✓ New photo selected
              </span>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Your name"
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none transition-all focus:border-[#4285F4] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
              <MdEmail className="text-gray-400 text-sm flex-shrink-0" />
              <span className="text-sm text-gray-500 truncate">
                {user?.email || "—"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Email cannot be changed.
            </p>
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
              <MdErrorOutline className="flex-shrink-0 text-lg mt-0.5" />
              <span className="break-all">{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-xl">
              <MdCheck className="flex-shrink-0 text-green-500" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition font-medium disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#4285F4] text-white rounded-full text-sm font-semibold hover:bg-[#1a73e8] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                Saving…
              </>
            ) : (
              <>
                <MdSave className="text-base" />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
