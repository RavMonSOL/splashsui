// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { MessageSquare, Wallet, Activity, ThumbsUp, Share2, Loader2, Heart, User as UserIcon, RefreshCw, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

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

const PostCard = ({ post, onLikeToggle, onCreateComment, onFetchComments, loggedInUser, onNavigate }) => { 
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false); 
  const [isFetchingPostComments, setIsFetchingPostComments] = useState(false);

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) { alert("Comment cannot be empty."); return; }
    if (!loggedInUser) { alert("Please connect your wallet to comment."); return; }
    const newComment = await onCreateComment(post.id, commentInput);
    if (newComment) { setCommentInput(''); if (!showComments) { setShowComments(true); } }
  };

  const toggleAndFetchComments = async () => {
    const newShowCommentsState = !showComments;
    setShowComments(newShowCommentsState);
    if (newShowCommentsState && !post.areCommentsFetched && post.commentsCount > 0) {
      setIsFetchingPostComments(true); await onFetchComments(post.id); setIsFetchingPostComments(false);
    } else if (newShowCommentsState && post.commentsCount > 0 && post.comments.length === 0 && post.areCommentsFetched === false) {
      setIsFetchingPostComments(true); await onFetchComments(post.id); setIsFetchingPostComments(false);
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
            <img src={post.user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.user?.sui_address || post.user?.username || post.user_id}`} 
                 alt={post.user?.name || post.user?.username} 
                 className="w-10 h-10 rounded-full object-cover" 
                 onError={(e) => { e.target.onerror = null; e.target.src=`https://api.dicebear.com/7.x/initials/svg?seed=${post.user?.name || post.user?.username || 'P'}`}} 
            />
        </div>
        <div> 
            <div 
                className="flex items-baseline space-x-2 cursor-pointer hover:opacity-80"
                onClick={() => post.user?.sui_address && onNavigate('profile', { suiAddress: post.user.sui_address })}
            >
                <span className="font-semibold text-gray-900 dark:text-white">{post.user?.name || post.user?.username}</span> 
                <span className="text-xs text-gray-500 dark:text-gray-400"> @{post.user?.username || 'anon'}</span> 
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">· {post.timestamp} </span>
            <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p> 
        </div>
      </div>
      {post.media && <img src={post.media} alt="Post media" className="mt-2 rounded-lg w-full" />}
       <div className="mt-3 flex justify-around items-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2 text-sm">
          <Button variant="ghost" size="sm" icon={post.isLikedByCurrentUser ? Heart : ThumbsUp} onClick={() => onLikeToggle(post.id)} className={`${post.isLikedByCurrentUser ? '!text-red-500 fill-red-500' : ''} flex items-center`}> <span className="ml-1">Like ({post.likes})</span> </Button>
          <Button variant="ghost" size="sm" icon={MessageSquare} onClick={toggleAndFetchComments} className="flex items-center"> <span className="ml-1">Comment ({post.commentsCount})</span> </Button>
          <Button variant="ghost" size="sm" icon={Share2} className="flex items-center"> <span className="ml-1">Share ({post.sharesCount})</span> </Button>
        </div>
        {showComments && (
            <div className="mt-4 pt-3 border-t dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Comments ({displayableComments.length} of {post.commentsCount}):</h4>
                {post.commentsCount > 0 && (<Button variant="ghost" size="sm" icon={RefreshCw} onClick={async () => { setIsFetchingPostComments(true); await onFetchComments(post.id); setIsFetchingPostComments(false); }} className="p-1 text-xs">Refresh</Button>)}
              </div>
              {isFetchingPostComments ? ( <div className="text-center py-4"> <Loader2 size={24} className="mx-auto text-blue-500 animate-spin" /> <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading comments...</p> </div>
              ) : displayableComments.length > 0 ? ( <div className="max-h-60 overflow-y-auto space-y-2 pr-1"> {displayableComments.map(comment => <CommentDisplay key={comment.id} comment={comment} />)} </div>
              ) : ( <p className="text-xs text-gray-500 dark:text-gray-400"> {post.commentsCount > 0 ? "No comments loaded. Click 'Comment' or 'Refresh'." : "No comments yet. Be the first!"} </p> )}
              {loggedInUser && ( <div className="mt-3 flex items-center space-x-2"> <Input placeholder="Write a comment..." value={commentInput} onChange={(e) => setCommentInput(e.target.value)} className="flex-grow !mb-0" name={`comment-input-${post.id}`} /> <Button size="sm" onClick={handleCommentSubmit} disabled={!commentInput.trim()}>Post</Button> </div> )}
            </div>
          )}
    </Card>
  );
};


const ProfilePage = ({ appUser, profileSuiAddress, allPosts, isAppUserPostsLoading, onNavigate, onLikeToggle, onCreateComment, onFetchComments, onFollow, onUnfollow }) => {
  const [profileUser, setProfileUser] = useState(null); 
  const [isProfileDataLoading, setIsProfileDataLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [isCurrentUserFollowingThisProfile, setIsCurrentUserFollowingThisProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const getCountSafely = (countArray) => {
    if (Array.isArray(countArray) && countArray.length > 0) {
      const firstElement = countArray[0];
      if (firstElement && typeof firstElement.count === 'number') {
        return firstElement.count;
      }
    }
    return 0;
  };

  const fetchDisplayedUserProfileData = useCallback(async () => {
    const targetSuiAddress = profileSuiAddress || appUser?.sui_address;
    if (!targetSuiAddress) {
      setIsProfileDataLoading(false); setProfileUser(null); return;
    }
    
    if (appUser && appUser.sui_address === targetSuiAddress && typeof appUser.followers_count === 'number') {
        setProfileUser(appUser); setIsCurrentUserFollowingThisProfile(false); setIsProfileDataLoading(false); return;
    }
    
    setIsProfileDataLoading(true);
    try {
      const { data, error } = await supabase.from('profiles')
        .select(`*, following_count:follows!follower_id(count), followers_count:follows!following_id(count)`)
        .eq('sui_address', targetSuiAddress).single();

      if (error) {
        if (error.code !== 'PGRST116') console.error("Error fetching profile user data:", error.message, error); 
        setProfileUser(null); 
        if (error.code !== 'PGRST116') throw error;
      }

      if (data) {
        const fetchedProfile = { ...data,
            following_count: getCountSafely(data.following_count),
            followers_count: getCountSafely(data.followers_count),
            suiBalance: data.suiBalance || (appUser && appUser.sui_address === targetSuiAddress ? appUser.suiBalance : Math.random() * 10), 
            tokens: data.tokens || (appUser && appUser.sui_address === targetSuiAddress ? appUser.tokens : []), 
        };
        setProfileUser(fetchedProfile);
        if (appUser && appUser.id && data.id && appUser.id !== data.id) {
          const { count: followCount, error: followCheckError } = await supabase
            .from('follows').select('*', { count: 'exact', head: true })
            .match({ follower_id: appUser.id, following_id: data.id });
          
          if (followCheckError) { console.error("Error checking follow status:", followCheckError.message); }
          else { setIsCurrentUserFollowingThisProfile(typeof followCount === 'number' && followCount > 0); }
        } else { setIsCurrentUserFollowingThisProfile(false); }
      } else {
        setProfileUser(null);
        console.warn("ProfilePage: Profile fetch returned no data for address:", targetSuiAddress);
      }
    } catch (err) { 
        console.error("ProfilePage: Exception during profile data fetch:", err); 
        setProfileUser(null);
    } finally { setIsProfileDataLoading(false); }
  }, [profileSuiAddress, appUser]); 

  useEffect(() => {
    fetchDisplayedUserProfileData();
  }, [fetchDisplayedUserProfileData]);

  useEffect(() => {
    if (profileUser && allPosts) {
      const filteredPosts = allPosts.filter(post => post.user_id === profileUser.id);
      setUserPosts(filteredPosts);
    } else { setUserPosts([]); }
  }, [profileUser, allPosts]);

  const handleFollowToggle = async () => {
    if (!appUser || !profileUser || appUser.id === profileUser.id) { alert("You must be logged in to follow users."); return; }
    let success;
    if (isCurrentUserFollowingThisProfile) { success = await onUnfollow(profileUser.id);
    } else { success = await onFollow(profileUser.id); }
    if (success) { 
        setIsCurrentUserFollowingThisProfile(!isCurrentUserFollowingThisProfile);
        setProfileUser(prev => {
            if (!prev) return null;
            return {
                ...prev,
                followers_count: isCurrentUserFollowingThisProfile ? Math.max(0, (prev.followers_count || 0) - 1) : (prev.followers_count || 0) + 1
            };
        });
    } 
  };

  if (isProfileDataLoading && !profileUser) { 
    return ( <div className="p-6 text-center"> <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-500" /> <p>Loading profile...</p> </div> );
  }
  if (!profileUser) { 
    return ( <div className="p-6 text-center"> <p>Profile not found or could not be loaded.</p> <Button className="mt-4" onClick={() => onNavigate('home')}>Go to Home</Button> </div> );
  }
  
  const isOwnProfile = appUser && profileUser && appUser.id === profileUser.id;

  return (
    <div className="p-4 sm:p-6">
      <Card className="mb-6 overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-700 dark:to-blue-700 relative">
            <img 
                src={profileUser.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profileUser.sui_address || profileUser.username || profileUser.id}`} 
                alt={profileUser.display_name || profileUser.username} 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 shadow-lg object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src=`https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.display_name || profileUser.username || 'SUI'}`}}
            />
        </div>
        <div className="pt-16 sm:pt-20 text-center"> <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{profileUser.display_name || profileUser.username}</h2> <p className="text-gray-600 dark:text-gray-400">@{profileUser.username || 'sui_user'}</p> <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto px-4">{profileUser.bio || 'No bio yet.'}</p> </div>
        <div className="flex justify-center items-center space-x-4 sm:space-x-8 mt-4 pb-6 border-b dark:border-gray-700"> <div className="text-center"> <p className="font-semibold text-lg text-gray-900 dark:text-white">{userPosts.length}</p> <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p> </div> <div className="text-center"> <p className="font-semibold text-lg text-gray-900 dark:text-white">{profileUser.followers_count || 0}</p> <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p> </div> <div className="text-center"> <p className="font-semibold text-lg text-gray-900 dark:text-white">{profileUser.following_count || 0}</p> <p className="text-sm text-gray-500 dark:text-gray-400">Following</p> </div> </div>
        <div className="flex justify-center mt-4 mb-2 space-x-2">
            {isOwnProfile ? (
                <Button variant="primary" onClick={() => onNavigate('settings')}>Edit Profile</Button>
            ) : appUser ? ( 
                <Button 
                    onClick={handleFollowToggle} 
                    variant={isCurrentUserFollowingThisProfile ? "secondary" : "primary"}
                    icon={isCurrentUserFollowingThisProfile ? UserMinus : UserPlus}
                    disabled={!profileUser.id} 
                >
                    {isCurrentUserFollowingThisProfile ? "Unfollow" : "Follow"}
                </Button>
            ) : null }
        </div>
      </Card>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 justify-center" aria-label="Tabs"> {['posts', 'tokens', 'activity'].map((tab) => ( <button key={tab} onClick={() => setActiveTab(tab)} className={`${ activeTab === tab ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600' } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base capitalize flex items-center`} > {tab === 'posts' && <MessageSquare size={18} className="mr-2"/>} {tab === 'tokens' && <Wallet size={18} className="mr-2"/>} {tab === 'activity' && <Activity size={18} className="mr-2"/>} {tab} </button> ))} </nav>
      </div>

      <div>
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Posts by {profileUser.display_name || profileUser.username}</h3>
            {isAppUserPostsLoading && userPosts.length === 0 ? (
                <Card className="text-center py-8"> <Loader2 size={48} className="mx-auto text-blue-500 animate-spin mb-4" /> <p className="text-lg font-semibold">Loading posts...</p> </Card>
            ) : userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard 
                  key={post.id} post={post} 
                  onLikeToggle={onLikeToggle} onCreateComment={onCreateComment}
                  onFetchComments={onFetchComments} 
                  loggedInUser={appUser} 
                  onNavigate={onNavigate}
                />
              ))
            ) : (
              <Card className="text-center py-8"> <MessageSquare size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" /> <p className="text-gray-500 dark:text-gray-400">This user hasn't made any posts yet.</p> {isOwnProfile && ( <Button className="mt-4" onClick={() => onNavigate('home', { openCreatePost: true })}>Make your first post</Button> )} </Card>
            )}
          </div>
        )}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Tokens Held by {profileUser.display_name || profileUser.username}</h3>
            {(profileUser.tokens && profileUser.tokens.length > 0) ? (
              profileUser.tokens.map(token => {
                const displayValue = ((token.balance || 0) * (token.price || 0)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                const displayPrice = typeof token.price === 'number' ? `$${token.price.toFixed(2)}` : 'N/A';

                return (
                  <Card key={token.id || token.symbol} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img src={token.logo} alt={token.name} className="w-10 h-10 rounded-full mr-3 object-cover" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{token.name} ({token.symbol})</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Balance: {(token.balance || 0).toLocaleString()} {token.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-semibold text-gray-900 dark:text-white">${displayValue}</p>
                       <p className="text-sm text-gray-500 dark:text-gray-400">Price: {displayPrice}</p>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="text-center py-8">
                <Wallet size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">This user doesn't hold any community tokens yet.</p>
                {isOwnProfile && <Button className="mt-4" onClick={() => onNavigate('trading')}>Explore Tokens</Button>}
              </Card>
            )}
          </div>
        )}
        {activeTab === 'activity' && (
          <Card className="text-center py-8">
            <Activity size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Recent Activity</h3>
            <p className="text-gray-500 dark:text-gray-400">User's recent interactions and notifications will appear here. (Feature to be implemented)</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
