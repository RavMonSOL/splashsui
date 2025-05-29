// src/pages/HomePage.jsx
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Textarea from '../components/Textarea';
import Input from '../components/Input'; 
import { ThumbsUp, MessageSquare, Share2, PlusCircle, Shield, TrendingUp, Rocket, Loader2, Heart, RefreshCw, Users, Globe } from 'lucide-react';

// Simple Comment Component (can be moved to its own file later)
const CommentDisplay = ({ comment }) => ( 
  <div className="mt-2 flex items-start space-x-2 text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
    <img 
      src={comment.user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.user?.username || comment.user?.id}`} 
      alt={comment.user?.name || comment.user?.username} 
      className="w-6 h-6 rounded-full object-cover"
      onError={(e) => { e.target.onerror = null; e.target.src=`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.name || 'U'}`}}
    />
    <div>
      <span className="font-semibold text-gray-800 dark:text-gray-100">{comment.user?.name || comment.user?.username || 'User'}</span>
      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
      <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{comment.created_at}</p>
    </div>
  </div>
);


// Post Card Component (can be moved to its own file later)
const PostCard = ({ post, onLikeToggle, onCreateComment, onFetchComments, loggedInUser, onNavigate }) => {
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false); 
  const [isFetchingPostComments, setIsFetchingPostComments] = useState(false);

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) {
        alert("Comment cannot be empty.");
        return;
    }
    if (!loggedInUser) {
        alert("Please connect your wallet to comment.");
        return;
    }
    const newComment = await onCreateComment(post.id, commentInput);
    if (newComment) { // onCreateComment in App.jsx now returns the new comment or null
      setCommentInput(''); 
      // If comments weren't shown, show them now that a new one is added.
      if (!showComments) {
          setShowComments(true);
          // If comments weren't fetched yet for this post, fetch them.
          // The new comment is added optimistically, but fetching ensures others are loaded.
          if (!post.areCommentsFetched && post.commentsCount > 0) { // Check commentsCount before fetching
            setIsFetchingPostComments(true);
            await onFetchComments(post.id);
            setIsFetchingPostComments(false);
          }
      }
    }
  };

  const toggleAndFetchComments = async () => {
    const newShowCommentsState = !showComments;
    setShowComments(newShowCommentsState);
    // If expanding comments and they haven't been fetched yet AND there are comments to fetch
    if (newShowCommentsState && !post.areCommentsFetched && post.commentsCount > 0) {
      setIsFetchingPostComments(true);
      await onFetchComments(post.id);
      setIsFetchingPostComments(false);
    } else if (newShowCommentsState && post.commentsCount > 0 && post.comments.length === 0 && post.areCommentsFetched === false ) {
      // This case handles if optimistic update added a comment but full list wasn't fetched
      setIsFetchingPostComments(true);
      await onFetchComments(post.id);
      setIsFetchingPostComments(false);
    }
  };
  
  const displayableComments = post.comments || [];

  return (
    <Card>
      <div className="flex items-start space-x-3">
        <div 
          className="flex-shrink-0 cursor-pointer hover:opacity-80"
          onClick={() => post.user?.sui_address && onNavigate('profile', { suiAddress: post.user.sui_address })}
        >
          <img 
            src={post.user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.user?.sui_address || post.user?.username || post.user_id}`} 
            alt={post.user?.name || post.user?.username} 
            className="w-12 h-12 rounded-full object-cover" 
            onError={(e) => { e.target.onerror = null; e.target.src=`https://api.dicebear.com/7.x/initials/svg?seed=${post.user?.name || 'P'}`}}
          />
        </div>
        <div>
          <div 
            className="flex items-baseline space-x-1 cursor-pointer hover:opacity-80" // Reduced space-x-2 to space-x-1
            onClick={() => post.user?.sui_address && onNavigate('profile', { suiAddress: post.user.sui_address })}
          >
            <span className="font-semibold text-gray-900 dark:text-white">{post.user?.name || post.user?.username || 'Anonymous'}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              @{post.user?.username || 'anon'}
            </span>
          </div>
           <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">· {post.timestamp}</span> {/* Added ml-1 for spacing */}
          {post.tokenGated && ( 
            <div className="mt-1 flex items-center text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-full w-fit">
              <Shield size={14} className="mr-1" />
              Token Gated: Requires ${post.requiredToken || 'specific token'}
            </div>
          )}
          <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>
      {post.media && <img src={post.media} alt="Post media" className="mt-3 rounded-lg w-full object-cover max-h-96" />}
      <div className="mt-4 flex justify-around items-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-3">
        <Button 
          variant="ghost" size="sm" 
          icon={post.isLikedByCurrentUser ? Heart : ThumbsUp}
          onClick={() => onLikeToggle(post.id)}
          className={`${post.isLikedByCurrentUser ? '!text-red-500 fill-red-500' : ''} flex items-center`}
        >
          <span className="ml-1">Like ({post.likes})</span>
        </Button>
        <Button variant="ghost" size="sm" icon={MessageSquare} onClick={toggleAndFetchComments} className="flex items-center">
          <span className="ml-1">Comment ({post.commentsCount})</span>
        </Button>
        <Button variant="ghost" size="sm" icon={Share2} className="flex items-center">
          <span className="ml-1">Share ({post.sharesCount})</span>
        </Button>
      </div>

      {showComments && (
        <div className="mt-4 pt-3 border-t dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Comments ({displayableComments.length} of {post.commentsCount}):</h4>
            {post.commentsCount > 0 && (
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={async () => {
                    setIsFetchingPostComments(true);
                    await onFetchComments(post.id);
                    setIsFetchingPostComments(false);
                }} className="p-1 text-xs">Refresh</Button>
            )}
          </div>
          {isFetchingPostComments ? (
            <div className="text-center py-4">
              <Loader2 size={24} className="mx-auto text-blue-500 animate-spin" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading comments...</p>
            </div>
          ) : displayableComments.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {displayableComments.map(comment => <CommentDisplay key={comment.id} comment={comment} />)}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {post.commentsCount > 0 ? "No comments loaded. Click 'Comment' or 'Refresh'." : "No comments yet. Be the first!"}
            </p>
          )}
          {loggedInUser && (
            <div className="mt-3 flex items-center space-x-2">
              <Input 
                placeholder="Write a comment..." value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-grow !mb-0" name={`comment-input-${post.id}`} 
              />
              <Button size="sm" onClick={handleCommentSubmit} disabled={!commentInput.trim()}>Post</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};


const HomePage = ({ 
    user, posts, isPostsLoading, trendingTokens, launchpadProjects, 
    onNavigate, onPostCreate, onLikeToggle, onCreateComment, onFetchComments,
    activeFeedType, setActiveFeedType 
}) => {
  const [newPostContent, setNewPostContent] = useState("");
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const handlePostSubmit = () => {
    if (newPostContent.trim() && user) {
      onPostCreate({ content: newPostContent, media_url: null });
      setNewPostContent("");
      setShowCreatePostModal(false);
    } else if (!user) {
      alert("Please connect your wallet and load your profile to post.");
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6">
      <div className="lg:col-span-2 space-y-6">
        {user && (
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white dark:from-blue-700 dark:to-indigo-800">
            <div className="flex items-center space-x-3">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.sui_address || user.username}`} 
                alt={user.name || user.username} 
                className="w-12 h-12 rounded-full border-2 border-white object-cover" 
                onError={(e) => { e.target.onerror = null; e.target.src=`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'U'}`}}
              />
              <input
                type="text"
                placeholder={`What's on your mind, ${user.name ? user.name.split(' ')[0] : 'User'}?`}
                className="flex-grow p-3 rounded-lg bg-white/20 placeholder-white/70 focus:bg-white/30 focus:outline-none text-white"
                onClick={() => setShowCreatePostModal(true)}
                readOnly
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={() => setShowCreatePostModal(true)} variant="secondary" className="bg-white/90 hover:bg-white text-blue-600 dark:bg-gray-200/90 dark:hover:bg-gray-200 dark:text-blue-700" icon={PlusCircle}>
                Create Post
              </Button>
            </div>
          </Card>
        )}

        <div className="flex space-x-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg sticky top-[calc(4rem+1px)] z-30 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
            <Button
                variant={activeFeedType === 'global' ? 'primary' : 'secondary'}
                onClick={() => setActiveFeedType('global')}
                className="flex-1 !py-2 !px-3 !text-sm shadow-sm"
                icon={Globe}
            >
                Global Feed
            </Button>
            {user && (
                 <Button
                    variant={activeFeedType === 'following' ? 'primary' : 'secondary'}
                    onClick={() => setActiveFeedType('following')}
                    className="flex-1 !py-2 !px-3 !text-sm shadow-sm"
                    icon={Users}
                >
                    Following
                </Button>
            )}
        </div>

        {isPostsLoading && (!posts || posts.length === 0) ? (
          <Card className="text-center py-8"> <Loader2 size={48} className="mx-auto text-blue-500 animate-spin mb-4" /> <p className="text-lg font-semibold">Loading posts...</p> </Card>
        ) : posts && posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.id} post={post} onLikeToggle={onLikeToggle} onCreateComment={onCreateComment} onFetchComments={onFetchComments} loggedInUser={user} onNavigate={onNavigate} />
          ))
        ) : !isPostsLoading && posts && posts.length === 0 ? (
          <Card className="text-center py-8"> 
            <MessageSquare size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" /> 
            <p className="text-gray-500 dark:text-gray-400">
                {activeFeedType === 'following' && user ? "You're not following anyone yet, or the users you follow haven't posted." : "No posts yet. Be the first to share something!"}
            </p>
          </Card>
        ) : null}
      </div>
      <div className="space-y-6">
        <Card>
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center"><TrendingUp className="mr-2 text-green-500"/>Trending Tokens</h3>
          <ul className="space-y-3">
            {trendingTokens.map(token => (
              <li key={token.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={() => onNavigate('trading', { token })}>
                <div className="flex items-center"> <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full mr-3 object-cover" /> <div> <p className="font-medium text-gray-800 dark:text-gray-100">{token.name} ({token.symbol})</p> <p className="text-sm text-gray-600 dark:text-gray-400">${token.price}</p> </div> </div>
                <span className={`text-sm font-semibold ${token.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{token.change}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center"><Rocket className="mr-2 text-indigo-500"/>Active Launches</h3>
           <ul className="space-y-3">
            {launchpadProjects.slice(0,2).map(project => (
              <li key={project.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={() => onNavigate('launchpad', { project })}>
                <div className="flex items-center mb-1"> <img src={project.logo} alt={project.name} className="w-8 h-8 rounded-full mr-3 object-cover" /> <p className="font-medium text-gray-800 dark:text-gray-100">{project.name}</p> </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">{project.description}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1"> <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(parseFloat(project.raised.replace(/,/g, '').replace(' SUI', '')) / parseFloat(project.goal.replace(/,/g, '').replace(' SUI', ''))) * 100 || 0}%` }}></div> </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{project.raised} / {project.goal} raised</p>
              </li>
            ))}
          </ul>
          <Button variant="ghost" className="w-full mt-3" onClick={() => onNavigate('launchpad')}>View All Launches</Button>
        </Card>
      </div>
      <Modal isOpen={showCreatePostModal} onClose={() => setShowCreatePostModal(false)} title="Create a new post">
        <Textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Share your thoughts..." rows={5}/>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={() => setShowCreatePostModal(false)}>Cancel</Button>
          <Button onClick={handlePostSubmit} disabled={!newPostContent.trim() || !user}>Post</Button>
        </div>
      </Modal>
    </div>
  );
};
export default HomePage;
