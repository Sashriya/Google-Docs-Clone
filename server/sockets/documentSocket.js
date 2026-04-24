import Document from "../models/Document.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const documentSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User Attempting Connection:", socket.id);
    socket.on("join-document", async (data) => {
      console.log("join-document payload:", data);
      const { docId, token } =
        typeof data === "string" ? JSON.parse(data) : data;

      if (!token) {
        return socket.emit("error", "JWT Token is required");
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select(
          "name email profilePic",
        );

        if (!user) return socket.emit("error", "Invalid User");

        const document = await Document.findById(docId);
        if (!document) return socket.emit("error", "Document Not Found");

        const isOwner = document.owner.toString() === user._id.toString();
        const isCollaborator = document.collaborators.some(
          (c) => c.user.toString() === user._id.toString(),
        );

        if (!isOwner && !isCollaborator) {
          return socket.emit("error", "Access Denied");
        }

        socket.join(docId);
        socket.data.user = user;
        socket.emit("load-document", document.content);
        socket.to(docId).emit("user-joined", {
          name: user.name,
          id: user._id,
        });

        console.log(`User ${user.name} joined room: ${docId}`);
      } catch (err) {
        console.error("Socket Auth Error:", err.message);
        socket.emit("error", "Authentication Failed");
      }
    });
    socket.on("send-changes", (data) => {
      const { docId, delta } =
        typeof data === "string" ? JSON.parse(data) : data;
      socket.to(docId).emit("receive-changes", delta);
    });
    socket.on("new-comment", async (data) => {
      try {
        const { docId, comment } =
          typeof data === "string" ? JSON.parse(data) : data;
        const doc = await Document.findById(docId);
        if (!doc) return socket.emit("error", "Document not found");
        const commentToSave = {
          ...comment,
          user: socket.data.user?._id || comment.user,
        };

        doc.comments.push(commentToSave);
        const saved = await doc.save();
        const savedComment = saved.comments[saved.comments.length - 1];
        const out = savedComment.toObject
          ? savedComment.toObject()
          : { ...savedComment };
        out.userName =
          socket.data.user?.name || comment.userName || "Anonymous";

        io.in(docId).emit("receive-comment", out);
        console.log("Comment saved and emitted:", savedComment._id);
      } catch (err) {
        console.error("Comment Error:", err);
        socket.emit("error", "Failed to post comment");
      }
    });
    socket.on("reply-comment", async (data) => {
      try {
        const { docId, commentId, reply } =
          typeof data === "string" ? JSON.parse(data) : data;

        const doc = await Document.findById(docId);
        if (!doc) return socket.emit("error", "Document not found");

        const parentComment = doc.comments.id(commentId);
        if (!parentComment) return socket.emit("error", "Comment not found");

        const newReply = {
          user: socket.data.user?._id || reply.user,
          text: reply.text,
          createdAt: new Date(),
        };

        parentComment.replies.push(newReply);
        await doc.save();

        const savedReply =
          parentComment.replies[parentComment.replies.length - 1];

        io.in(docId).emit("receive-reply", {
          commentId,
          reply: {
            ...(savedReply.toObject ? savedReply.toObject() : savedReply),
            userName: socket.data.user?.name || reply.userName || "Anonymous",
          },
        });

        console.log("Reply saved for comment:", commentId);
      } catch (err) {
        console.error("Reply Error:", err);
        socket.emit("error", "Failed to post reply");
      }
    });
    socket.on("cursor-move", (data) => {
      const { docId, range } =
        typeof data === "string" ? JSON.parse(data) : data;
      socket.to(docId).emit("receive-cursor", {
        userId: socket.data.user?._id,
        name: socket.data.user?.name || "Anonymous",
        range,
      });
    });
    socket.on("save-document", async (data) => {
      const { docId, content } =
        typeof data === "string" ? JSON.parse(data) : data;
      try {
        await Document.findByIdAndUpdate(docId, { content });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    });
    socket.on("get-document-stats", (data) => {
      const { content } = typeof data === "string" ? JSON.parse(data) : data;
      const clean = content.replace(/<[^>]*>?/gm, "");
      const words = clean.trim() ? clean.trim().split(/\s+/).length : 0;
      socket.emit("receive-stats", { words, characters: clean.length });
    });
    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => {
        socket.to(room).emit("user-left", socket.data.user?._id);
      });
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected:", socket.id);
    });
  });
};

export default documentSocket;
