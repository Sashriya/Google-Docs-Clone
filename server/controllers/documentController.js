import Document from "../models/Document.js";
import User from "../models/User.js";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to convert HTML to plain text with better formatting
const htmlToPlainText = (html) => {
    if (!html) return '';
    
    let text = html;
    
    // Replace common HTML elements with appropriate formatting
    text = text.replace(/<h1[^>]*>/gi, '\n\n');
    text = text.replace(/<h2[^>]*>/gi, '\n\n');
    text = text.replace(/<h3[^>]*>/gi, '\n\n');
    text = text.replace(/<p[^>]*>/gi, '\n');
    text = text.replace(/<div[^>]*>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<li[^>]*>/gi, '• ');
    text = text.replace(/<\/li>/gi, '\n');
    text = text.replace(/<ul[^>]*>|<\/ul>/gi, '\n');
    text = text.replace(/<ol[^>]*>|<\/ol>/gi, '\n');
    
    // Remove all other HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&rsquo;/g, "'");
    text = text.replace(/&ldquo;/g, '"');
    text = text.replace(/&rdquo;/g, '"');
    
    // Collapse multiple newlines
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    text = text.replace(/^\s+|\s+$/g, '');
    
    return text;
};

export const createDoc = async (req, res) => {
    const { title } = req.body;
    try {
        const doc = await Document.create({
            title: title || 'Untitled Document',
            owner: req.user._id,
            content: "",
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getDoc = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('comments.user', 'name email');

        if (!doc) return res.status(404).json({ message: 'Not Found' });

        const isOwner = doc.owner._id.toString() === req.user._id.toString();
        const isCollaborator = doc.collaborators.some(
            (c) => c.user.toString() === req.user._id.toString()
        );

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ message: 'No Access' });
        }

        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const saveDoc = async (req, res) => {
    const { title, content, owner } = req.body;

    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document Not Found' });
        if (!req.user) return res.status(401).json({ message: 'User not authenticated' });

        const isOwner = doc.owner.toString() === req.user._id.toString();
        const isEditor = doc.collaborators?.some(
            (c) => c.user.toString() === req.user._id.toString() && c.role === 'editor'
        );

        if (!isOwner && !isEditor) {
            return res.status(403).json({ message: 'Permission Denied: Only Editors can Save' });
        }
        
        // Save version snapshot before updating
        if (content !== undefined && doc.content !== content) {
            doc.versions.push({
                content: doc.content,
                updatedBy: req.user._id,
                createdAt: new Date(),
            });
            if (doc.versions.length > 20) doc.versions.shift();
        }

        if (title !== undefined) doc.title = title;
        if (content !== undefined) doc.content = content;
        if (isOwner && owner) doc.owner = owner;

        await doc.save();

        const updatedDoc = await Document.findById(doc._id)
            .populate('owner', 'name email')
            .populate('collaborators.user', 'name email');

        return res.json(updatedDoc);
    } catch (error) {
        console.error('Critical Save Error:', error.message);
        return res.status(500).json({ message: 'Update Failed', error: error.message });
    }
};

export const deleteDoc = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document Not Found' });

        if (doc.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can delete this Document' });
        }

        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document Deleted Successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Delete Failed' });
    }
};

export const addCollaborators = async (req, res) => {
    const { email, role } = req.body;

    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document Not Found' });

        if (doc.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the Owner can Share this document' });
        }

        const userToAdd = await User.findOne({ email });
        if (!userToAdd) return res.status(404).json({ message: "User's Email Not Found" });

        const alreadyAdded = doc.collaborators.some(
            (c) => c.user.toString() === userToAdd._id.toString()
        );
        if (alreadyAdded) return res.status(400).json({ message: 'User Already has Access' });

        doc.collaborators.push({ user: userToAdd._id, role: role || 'viewer' });
        await doc.save();

        res.json({ message: `Document shared with ${email} as ${role || 'viewer'}` });
    } catch (error) {
        res.status(500).json({ message: 'Sharing Failed' });
    }
};

// FIXED: Export document as PDF with proper formatting
export const exportDoc = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id).populate('owner', 'name');
        
        if (!doc) {
            return res.status(404).json({ message: 'Document Not Found' });
        }

        const format = req.query.format;
        const title = doc.title || 'Untitled Document';
        
        if (format === 'pdf') {
            try {
                // Create a new PDF document with proper settings
                const pdfDoc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 72, bottom: 72, left: 72, right: 72 },
                    info: {
                        Title: title,
                        Author: doc.owner?.name || 'Unknown',
                        CreationDate: new Date(),
                        Producer: 'Docs Clone',
                        Creator: 'Docs Clone PDF Generator'
                    }
                });

                // Set response headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.pdf"`);
                res.setHeader('Cache-Control', 'no-cache');
                
                // Pipe PDF to response
                pdfDoc.pipe(res);

                // Add document title
                pdfDoc.fontSize(24)
                    .font('Helvetica-Bold')
                    .fillColor('#1a73e8')
                    .text(title, { align: 'center' });
                
                pdfDoc.moveDown(1.5);

                // Add metadata section
                pdfDoc.fontSize(10)
                    .font('Helvetica')
                    .fillColor('#666666');
                
                pdfDoc.text(`Created: ${new Date(doc.createdAt).toLocaleDateString()}`, { align: 'left' });
                pdfDoc.text(`Last Updated: ${new Date(doc.updatedAt).toLocaleDateString()}`, { align: 'left' });
                pdfDoc.text(`Author: ${doc.owner?.name || 'Unknown'}`, { align: 'left' });
                
                pdfDoc.moveDown(2);
                
                // Add horizontal line
                pdfDoc.strokeColor('#cccccc')
                    .lineWidth(0.5)
                    .moveTo(72, pdfDoc.y)
                    .lineTo(pdfDoc.page.width - 72, pdfDoc.y)
                    .stroke();
                
                pdfDoc.moveDown(1.5);
                
                // Convert HTML content to plain text
                const plainText = htmlToPlainText(doc.content);
                
                if (plainText && plainText.trim().length > 0) {
                    // Add content with proper text formatting
                    pdfDoc.fontSize(12)
                        .font('Helvetica')
                        .fillColor('#333333');
                    
                    // Split into paragraphs and add
                    const paragraphs = plainText.split('\n\n');
                    
                    for (let i = 0; i < paragraphs.length; i++) {
                        const para = paragraphs[i].trim();
                        if (para) {
                            // Handle bullet points
                            if (para.startsWith('•')) {
                                pdfDoc.fontSize(12)
                                    .text(para, {
                                        indent: 20,
                                        lineGap: 3
                                    });
                            } else {
                                pdfDoc.fontSize(12)
                                    .text(para, {
                                        lineGap: 3
                                    });
                            }
                            
                            if (i < paragraphs.length - 1) {
                                pdfDoc.moveDown(0.5);
                            }
                        }
                    }
                } else {
                    pdfDoc.fontSize(12)
                        .font('Helvetica-Oblique')
                        .fillColor('#999999')
                        .text('(Empty document)', { align: 'center' });
                }

                // Add page numbers
                const totalPages = pdfDoc.bufferedPageRange().count;
                for (let i = 0; i < totalPages; i++) {
                    pdfDoc.switchToPage(i);
                    pdfDoc.fontSize(8)
                        .font('Helvetica')
                        .fillColor('#999999')
                        .text(
                            `Page ${i + 1} of ${totalPages}`,
                            0,
                            pdfDoc.page.height - 40,
                            { align: 'center' }
                        );
                }

                // Finalize PDF
                pdfDoc.end();
                
                console.log(`PDF generated successfully for document: ${title}`);
                
            } catch (pdfError) {
                console.error('PDF Generation Error:', pdfError);
                // If PDF generation fails, send error response
                if (!res.headersSent) {
                    res.status(500).json({ 
                        message: 'PDF generation failed', 
                        error: pdfError.message 
                    });
                }
            }
        } 
        else if (format === 'txt') {
            // TXT export with better formatting
            const plainText = htmlToPlainText(doc.content);
            
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.txt"`);
            
            // Create formatted text content with metadata
            const textContent = [
                title,
                '='.repeat(Math.min(title.length, 50)),
                '',
                `Created: ${new Date(doc.createdAt).toLocaleString()}`,
                `Last Updated: ${new Date(doc.updatedAt).toLocaleString()}`,
                `Author: ${doc.owner?.name || 'Unknown'}`,
                '',
                '-'.repeat(50),
                '',
                plainText || '(Empty document)',
                '',
                '',
                `Generated by Docs Clone on ${new Date().toLocaleString()}`
            ].join('\n');
            
            res.send(textContent);
        }
        else {
            // Default: TXT format
            const plainText = htmlToPlainText(doc.content);
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.txt"`);
            res.send(plainText || '(Empty document)');
        }

    } catch (error) {
        console.error('Export Error:', error);
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ 
                message: 'Export Failed', 
                error: error.message 
            });
        }
    }
};

export const getVersionHistory = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .select('versions')
            .populate('versions.updatedBy', 'name email');

        if (!doc) return res.status(404).json({ message: 'Document Not Found' });
        res.json(doc.versions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to Fetch Versions' });
    }
};

export const addFavourites = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document Not Found' });
        doc.isStarred = !doc.isStarred;
        await doc.save();
        res.json({ isStarred: doc.isStarred });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getHistory = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id).select('history');
        if (!doc) return res.status(404).json({ message: 'Document Not Found' });
        res.json(doc.history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getLink = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        
        if (!doc) {
            return res.status(404).json({ message: 'Document Not Found' });
        }

        const isOwner = doc.owner.toString() === req.user._id.toString();
        const isCollaborator = doc.collaborators.some(
            (c) => c.user.toString() === req.user._id.toString()
        );

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ message: 'Access Denied' });
        }

        const sharedUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/shared/${doc._id}`;
        res.json({ sharedUrl });
        
    } catch (err) {
        console.error('getLink error:', err);
        res.status(500).json({ message: 'Link generation Failed' });
    }
};

export const sharedDoc = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .populate('owner', 'name email');

        if (!doc) {
            return res.status(404).json({ message: 'Document Not Found' });
        }
        
        if (doc.isPublic === true) {
            const publicDoc = {
                _id: doc._id,
                title: doc.title,
                content: doc.content,
                owner: doc.owner,
                isPublic: doc.isPublic,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt
            };
            return res.json(publicDoc);
        }
        
        return res.status(403).json({ 
            message: 'This document is private. Only the owner can share it.',
            isPublic: false 
        });
        
    } catch (err) {
        console.error('Shared doc error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

export const publicAccess = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        if (doc.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'Only the owner can change access settings' 
            });
        }
        
        const { isPublic } = req.body;
        
        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({ message: 'isPublic must be a boolean' });
        }
        
        doc.isPublic = isPublic;
        await doc.save();
        
        const sharedUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/shared/${doc._id}`;
        
        res.json({ 
            isPublic: doc.isPublic,
            sharedUrl: sharedUrl,
            message: isPublic ? 'Document is now public' : 'Document is now private'
        });
        
    } catch (err) {
        console.error('publicAccess error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

export const getDocument = async (req, res) => {
    try {
        const documents = await Document.find({ owner: req.user._id }).sort({ updatedAt: -1 });
        res.status(200).json(documents);
    } catch (err) {
        console.error('Fetch Error:', err);
        res.status(500).json({ message: 'Document fetch failed' });
    }
};

export const profilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded. Check that uploads/ folder exists." });
        }

        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePic: fileUrl },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        console.error("Profile pic upload error:", err.message);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};