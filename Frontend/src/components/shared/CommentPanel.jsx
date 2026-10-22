/**
 * EVOLV — Shared CommentPanel component
 *
 * A slide-in panel that loads, creates, edits, and deletes comments for a
 * specific post.  Used by both HomePage and ProfilePage.
 *
 * Props:
 *   postId        {string|number}  – ID of the post whose comments to show.
 *   currentUser   {object}         – Authenticated user (id | userId | _id).
 *   onClose       {() => void}     – Called when the panel should close.
 *   onCountChange {(postId, delta: +1|-1) => void}
 *                                  – Tells the parent to adjust its comment count.
 *
 * APIs used (all via homePostService):
 *   GET    /api/posts/:postId/comments        – load comments
 *   POST   /api/posts/:postId/comments        – create comment
 *   PATCH  /api/comments/:commentId           – edit comment
 *   DELETE /api/comments/:commentId           – delete comment
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { homePostService } from '../../services/homePostService.js';
import { profileService } from '../../services/profileService.js';

const authorCache = new Map();

function authorFromComment(c) {
  const u = c.user ?? c.author ?? c.creator ?? c.profile ?? null;
  if (!u) return null;
  const name = u.username || u.fullName || u.name;
  const avatar = u.avatarUrl || u.avatar || u.profile?.avatarUrl || '';
  return name ? { name, avatar } : null;
}

export default function CommentPanel({ postId, currentUser, onClose, onCountChange,onCountSync }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [authors, setAuthors] = useState({});
  const pendingSubmit = useRef(false);
  const textareaRef = useRef(null);

  // Load comments when panel opens
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setLoading(true);

    homePostService.getComments(postId).then((data) => {
      if (!cancelled) {
        setComments(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    const ids = [...new Set(comments.map((c) => c.userId).filter((id) => id != null))];

    ids.forEach(async (id) => {
      const key = String(id);
      if (authorCache.has(key)) {
        setAuthors((a) => (a[key] ? a : { ...a, [key]: authorCache.get(key) }));
        return;
      }
      try {
        const p = await profileService.getPublicProfile(id);
        const info = {
          name: p?.username || p?.fullName || p?.name || '',
          avatar: p?.avatarUrl || p?.avatar || '',
        };
        if (!info.name) return;
        authorCache.set(key, info);
        if (!cancelled) setAuthors((a) => ({ ...a, [key]: info }));
      } catch {
        /* endpoint missing or user not found: fallback label is used */
      }
    });

    return () => { cancelled = true; };
  }, [comments]);

  // Focus textarea after comments load
  useEffect(() => {
    if (!loading && textareaRef.current) textareaRef.current.focus();
  }, [loading]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async () => {
    const text = newText.trim();
    if (!text || submitting || pendingSubmit.current) return;
    pendingSubmit.current = true;
    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await homePostService.createComment(postId, text);
      const created = result?.data ?? result;
      if (created?.id) {
        setComments((prev) => {
          if (prev.some((c) => String(c.id) === String(created.id))) return prev;
          return [...prev, created];
        });
        onCountChange?.(postId, 1);
      }
      setNewText('');
    } catch (err) {
      console.error('[CommentPanel] createComment failed:', err.message);
      setSubmitError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
      pendingSubmit.current = false;
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.content);
    setEditError('');
  };

  const handleEditSave = async (commentId) => {
    const text = editText.trim();
    if (!text || editSaving) return;
    setEditSaving(true);
    setEditError('');

    try {
      const result = await homePostService.updateComment(commentId, text);
      const updated = result?.data ?? result;
      setComments((prev) =>
        prev.map((c) =>
          String(c.id) === String(commentId)
            ? { ...c, content: updated?.content ?? text }
            : c
        )
      );
      setEditingId(null);
      setEditText('');
    } catch (err) {
      console.error('[CommentPanel] updateComment failed:', err.message);
      setEditError(err.message || 'Failed to update. Try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeleteError('');
    const snapshot = comments;
    setComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));
    onCountChange?.(postId, -1);

    try {
      await homePostService.deleteComment(commentId);
    } catch (err) {
      console.error('[CommentPanel] deleteComment failed:', err.message);
      setComments(snapshot);
      onCountChange?.(postId, 1);
      setDeleteError(err.message || 'Failed to delete. Try again.');
    }
  };

  const currentUserId = currentUser?.id ?? currentUser?.userId ?? currentUser?._id;

  return (
    <>
      {/* Backdrop */}
      <div
        className="hp-comment-backdrop"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 900, backdropFilter: 'blur(2px)',
        }}
      />
      {/* Panel */}
      <div
        className="hp-comment-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: 'min(420px, 100vw)',
          background: '#fff',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.14)',
          zIndex: 901,
          display: 'flex', flexDirection: 'column',
          borderRadius: '16px 0 0 16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(9,3,15,0.08)',
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a0a2e' }}>
            Comments
            {!loading && (
              <span style={{ fontSize: 13, fontWeight: 400, color: '#8b7aa3', marginLeft: 6 }}>
                ({comments.length})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close comments"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#5b4d6e', padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading ? (
            <p style={{ color: '#8b7aa3', fontSize: 14, textAlign: 'center', marginTop: 32 }}>
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p style={{ color: '#8b7aa3', fontSize: 14, textAlign: 'center', marginTop: 32 }}>
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((comment) => {
              const isOwn = currentUserId != null && String(comment.userId) === String(currentUserId);
              const isEditing = editingId === comment.id;
              const author =
                authorFromComment(comment) ||
                authors[String(comment.userId)] ||
                { name: `User ${comment.userId}`, avatar: '' };
              return (
                <div
                  key={comment.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(9,3,15,0.06)',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                    <div
                      aria-hidden="true"
                      style={{
                        width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
                        background: '#e8d5ff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#7c3aed', flexShrink: 0,
                      }}
                    >
                      {author.avatar ? (
                        <img
                          src={author.avatar}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        author.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#2d1b4e' }}>
                        {author.name}
                      </span>
                      <span style={{ fontSize: 11, color: '#9688a5', marginLeft: 6 }}>
                        {comment.createdAt
                          ? new Date(comment.createdAt).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                    {isOwn && !isEditing && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleEdit(comment)}
                          aria-label="Edit comment"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#8b7aa3', padding: 2, fontSize: 12,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          aria-label="Delete comment"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#ef476f', padding: 2, fontSize: 12,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div style={{ marginLeft: 38 }}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '6px 10px', border: '1px solid #e5e1eb',
                          borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                        aria-label="Edit comment text"
                      />
                      {editError && (
                        <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>
                          {editError}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          onClick={() => handleEditSave(comment.id)}
                          disabled={editSaving}
                          style={{
                            padding: '5px 14px', background: '#7c3aed', color: '#fff',
                            border: 'none', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {editSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditError(''); }}
                          disabled={editSaving}
                          style={{
                            padding: '5px 12px', background: 'none', color: '#8b7aa3',
                            border: '1px solid #e5e1eb', borderRadius: 20,
                            fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: '2px 0 0 38px', fontSize: 14, color: '#2d1b4e', lineHeight: 1.5 }}>
                      {comment.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
          {deleteError && (
            <p role="alert" style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>
              {deleteError}
            </p>
          )}
        </div>

        {/* New comment input */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(9,3,15,0.08)',
          flexShrink: 0,
        }}>
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            maxLength={1000}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', border: '1px solid #e5e1eb',
              borderRadius: 12, fontSize: 14, fontFamily: 'inherit',
              resize: 'none', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            aria-label="New comment"
          />
          {submitError && (
            <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 6px' }}>
              {submitError}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || !newText.trim()}
              style={{
                padding: '8px 20px', background: '#1a0a2e', color: '#fff',
                border: 'none', borderRadius: 20, fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
                opacity: (!newText.trim() || submitting) ? 0.55 : 1,
              }}
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
