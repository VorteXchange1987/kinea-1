import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { ThumbsUp, Reply, Pin, Trash2, Edit2, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommentSection = ({ episodeId }) => {
  const { user, token, isAuthenticated, isModerator, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [episodeId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/episodes/${episodeId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API}/comments`,
        {
          episode_id: episodeId,
          content: newComment,
          parent_comment_id: replyTo?.id || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewComment('');
      setReplyTo(null);
      toast.success('Yorum eklendi');
      await fetchComments();
    } catch (error) {
      const message = error.response?.data?.detail || 'Yorum eklenemedi';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }

    try {
      await axios.post(
        `${API}/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handlePin = async (commentId) => {
    try {
      await axios.post(
        `${API}/comments/${commentId}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Yorum sabitleme durumu değiştirildi');
      await fetchComments();
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`${API}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Yorum silindi');
      await fetchComments();
    } catch (error) {
      toast.error('Yorum silinemedi');
    }
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const canModerate = isModerator || comment.user_id === user?.id;
    const canPin = isAdmin;

    return (
      <div
        data-testid={`comment-${comment.id}`}
        className={`neomorph-flat p-4 ${
          comment.is_pinned ? 'border-2 border-gray-700' : ''
        }`}
      >
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={comment.user_profile_photo} />
            <AvatarFallback className="bg-gray-800 text-white">
              {comment.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold">{comment.username}</span>
              {comment.user_role === 'SUPER_ADMIN' && (
                <span className="admin-badge">Admin</span>
              )}
              {comment.user_role === 'MODERATOR' && (
                <span className="moderator-badge">KINEA Yardımcısı</span>
              )}
              {comment.is_pinned && (
                <Pin className="w-4 h-4 text-gray-400" />
              )}
            </div>

            <p className="text-gray-300 text-sm mb-2 break-words">{comment.content}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                {format(new Date(comment.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
              </span>

              {/* Like Button */}
              <button
                data-testid={`like-comment-${comment.id}`}
                onClick={() => handleLike(comment.id)}
                className="flex items-center gap-1 hover:text-white"
                disabled={!isAuthenticated}
              >
                <ThumbsUp className="w-3 h-3" />
                {comment.likes || 0}
              </button>

              {/* Reply Button */}
              {!isReply && isAuthenticated && (
                <button
                  data-testid={`reply-comment-${comment.id}`}
                  onClick={() => setReplyTo(comment)}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <Reply className="w-3 h-3" />
                  Yanıtla
                </button>
              )}

              {/* Pin Button (Admin only) */}
              {canPin && !isReply && (
                <button
                  data-testid={`pin-comment-${comment.id}`}
                  onClick={() => handlePin(comment.id)}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <Pin className="w-3 h-3" />
                  {comment.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                </button>
              )}

              {/* Delete Button */}
              {canModerate && (
                <button
                  data-testid={`delete-comment-${comment.id}`}
                  onClick={() => handleDelete(comment.id)}
                  className="flex items-center gap-1 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                  Sil
                </button>
              )}
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-800">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="comment-section" className="neomorph-flat p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Yorumlar ({comments.length})</h2>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between neomorph-input p-2">
              <span className="text-sm text-gray-400">
                {replyTo.username} kullanıcısına yanıt veriyorsunuz
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          )}
          <textarea
            data-testid="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Yorumunuzu yazın..."
            className="w-full neomorph-input px-4 py-3 text-white focus:outline-none min-h-[100px] mb-3"
            disabled={loading}
          />
          <button
            data-testid="submit-comment-button"
            type="submit"
            disabled={loading || !newComment.trim()}
            className="neomorph-btn px-6 py-2 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Gönderiliyor...' : 'Yorum Yap'}
          </button>
        </form>
      ) : (
        <div className="neomorph-input p-4 text-center mb-6">
          <p className="text-gray-400">Yorum yapmak için giriş yapmalısınız</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Henüz yorum yok. İlk yorumu siz yapın!</p>
          </div>
        ) : (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </div>
    </div>
  );
};

export default CommentSection;