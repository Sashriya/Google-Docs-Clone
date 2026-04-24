import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import DocumentCard from "../components/DocumentCard";
import { MdAdd, MdStar } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const { searchTerm, setSearchTerm } = useContext(AuthContext);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/docs/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(res.data);
      } catch (err) {
        console.error("Documents fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const deleteDocument = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/docs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed!");
    }
  };

  const renameDocument = async (id, currentTitle) => {
    const newTitle = prompt("Enter new document title:", currentTitle);
    if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/docs/${id}`,
        { title: newTitle.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? { ...doc, title: newTitle.trim() } : doc))
      );
    } catch (err) {
      alert("Rename failed!");
      console.error(err);
    }
  };
  
  const handleStarToggle = async (id) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc._id === id ? { ...doc, isStarred: !doc.isStarred } : doc))
    );
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:5000/api/docs/${id}/star`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? { ...doc, isStarred: res.data.isStarred } : doc))
      );
    } catch (err) {
      console.error("Star toggle failed:", err);
      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? { ...doc, isStarred: !doc.isStarred } : doc))
      );
    }
  };

  const createNewDoc = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/docs/create",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/editor/${res.data._id}`);
    } catch (err) {
      alert("Could not create a new document!");
      console.error(err);
      setCreating(false);
    }
  };
  
  const filteredDocs   = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const starredDocs    = filteredDocs.filter((doc) => doc.isStarred);
  const nonStarredDocs = filteredDocs.filter((doc) => !doc.isStarred);

  const DocGrid = ({ docs }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
      {docs.map((doc) => (
        <DocumentCard
          key={doc._id}
          doc={doc}
          onDelete={deleteDocument}
          onRename={renameDocument}
          onStarToggle={handleStarToggle}
        />
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="px-10 py-5">
        {searchTerm === "" && (
          <div className="mb-10">
            <h2 className="text-gray-700 font-medium mb-4">Start a new document</h2>
            <div className="flex flex-col items-start">
              <div
                onClick={createNewDoc}
                className={`w-40 h-52 bg-white border border-gray-300 rounded hover:border-blue-500 cursor-pointer flex items-center justify-center group transition shadow-sm ${
                  creating ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {creating ? (
                  <span className="animate-spin inline-block w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full" />
                ) : (
                  <div className="text-5xl text-red-500 group-hover:scale-110 transition-transform">
                    <MdAdd />
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">Blank</p>
            </div>
            <hr className="border-gray-200 mt-8" />
          </div>
        )}
        {loading ? (
          <div className="flex justify-center mt-10">
            <p className="text-gray-500 animate-pulse">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="mt-10 text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">
              {searchTerm === "" ? "No documents found." : `No matches for "${searchTerm}"`}
            </p>
            {searchTerm !== "" && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-blue-500 text-sm hover:underline"
              >
                Clear search and view all
              </button>
            )}
          </div>

        ) : (
          <>
            {starredDocs.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <MdStar className="text-yellow-400 text-xl" />
                  <h2 className="text-gray-700 font-semibold">Starred</h2>
                  {/* Badge showing count */}
                  <span className="bg-yellow-100 text-yellow-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {starredDocs.length}
                  </span>
                </div>
                <DocGrid docs={starredDocs} />
                {nonStarredDocs.length > 0 && <hr className="border-gray-200 mt-8" />}
              </div>
            )}
            {nonStarredDocs.length > 0 && (
              <div>
                <h2 className="text-gray-700 font-semibold mb-6">
                  {searchTerm === "" ? "Recent documents" : `Results for "${searchTerm}"`}
                </h2>
                <DocGrid docs={nonStarredDocs} />
              </div>
            )}
          </>
        )}

      </div>
    </Layout>
  );
};

export default Dashboard;