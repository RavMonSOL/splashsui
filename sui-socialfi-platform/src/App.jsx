// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Home, User, Rocket, Repeat, Wallet, Settings, Bell, Search, LogOut, Sun, Moon, Menu, X as CloseIcon, UserPlus, UserMinus } from 'lucide-react';
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { supabase } from './supabaseClient'; 

// Import Page Components
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LaunchpadPage from './pages/LaunchpadPage';
import TradingPage from './pages/TradingPage';
import WalletPage from './pages/WalletPage';
import SettingsPage from './pages/SettingsPage';

// Import Helper Components
import Button from './components/Button';

const initialTrendingTokensData = [
  { id: 'trend1', name: 'SuiGrowth', symbol: 'SGR', price: 0.12, change: "+5.2%", logo: "https://placehold.co/40x40/FBBF24/854D0E?text=SGR" },
  { id: 'trend2', name: 'ConnectX', symbol: 'CNX', price: 0.08, change: "+12.1%", logo: "https://placehold.co/40x40/6EE7B7/047857?text=CNX" },
  { id: 'trend3', name: 'ArtFi', symbol: 'ART', price: 1.50, change: "-2.5%", logo: "https://placehold.co/40x40/F472B6/9D174D?text=ART" },
  { id: 'token1', name: 'SocialCoin', symbol: 'SOC', price: 0.05, change: "+1.2%", logo: "https://placehold.co/40x40/A0AEC0/4A5568?text=SC" },
];

const initialLaunchpadProjectsData = [
  { 
    id: 'launch1', name: 'EcoVerse', symbol: 'ECOV', startPrice: 0.05, 
    description: 'A platform for funding environmental projects through decentralized governance.', 
    goal: '100,000 SUI', raised: '25,000 SUI', endsIn: '15 days', 
    logo: "https://placehold.co/60x60/A7F3D0/065F46?text=EV" 
  },
  { 
    id: 'launch2', name: 'GameGuild', symbol: 'GGILD', startPrice: 0.02,
    description: 'Empowering indie game developers with community-driven funding and support.', 
    goal: '50,000 SUI', raised: '45,000 SUI', endsIn: '5 days', 
    logo: "https://placehold.co/60x60/BFDBFE/1E40AF?text=GG" 
  },
];

const getCountSafely = (countArray) => {
    if (Array.isArray(countArray) && countArray.length > 0) {
      const firstElement = countArray[0];
      if (firstElement && typeof firstElement.count === 'number') {
        return firstElement.count;
      }
    }
    return 0;
  };

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageArgs, setPageArgs] = useState(null);
  const [appUser, setAppUser] = useState(null); 
  const [posts, setPosts] = useState([]); 
  const trendingTokensList = initialTrendingTokensData; 
  const [launchpadProjectsList, setLaunchpadProjectsList] = useState(initialLaunchpadProjectsData);
  const [activeFeedType, setActiveFeedType] = useState('global');

  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  // Notification State
  const [userNotifications, setUserNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const currentWallet = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  const fetchAppUserProfile = useCallback(async (suiAddress) => {
    if (!suiAddress) {
        setAppUser(null); setIsProfileLoading(false); return;
    }
    setIsProfileLoading(true);
    let userProfileData = null;
    try {
      let { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          *,
          following_count:follows!follower_id(count),
          followers_count:follows!following_id(count)
        `)
        .eq('sui_address', suiAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { 
        console.error('Error fetching profile (excluding not found):', fetchError.message);
        throw fetchError; 
      }
      
      if (profile) { 
        userProfileData = {
          ...profile,
          following_count: getCountSafely(profile.following_count),
          followers_count: getCountSafely(profile.followers_count),
        };
      } else {
        const defaultUsername = `user_${suiAddress.substring(suiAddress.length - 6)}`;
        const newProfileToInsert = { sui_address: suiAddress, username: defaultUsername,
          display_name: `SUI User ${suiAddress.substring(2, 6)}`,
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${suiAddress}`, bio: 'New SuiSocial adventurer!',
        };
        const { data: createdProfile, error: insertError } = await supabase
          .from('profiles').insert(newProfileToInsert).select().single();
        if (insertError) { 
            if (insertError.message.includes('duplicate key value violates unique constraint "profiles_username_key"')) {
                const fallbackUsername = `${defaultUsername}_${Math.random().toString(36).substring(2, 4)}`;
                const { data: fallbackProfile, error: fallbackError } = await supabase
                    .from('profiles').insert({ ...newProfileToInsert, username: fallbackUsername }).select().single();
                if (fallbackError) { console.error("Error creating profile with fallback username:", fallbackError.message); throw fallbackError;}
                userProfileData = { ...fallbackProfile, following_count: 0, followers_count: 0 };
            } else { console.error("Error creating profile:", insertError.message); throw insertError; }
        } else { 
          userProfileData = { ...createdProfile, following_count: 0, followers_count: 0 };
        }
      }
      if (userProfileData) {
        const augmentedProfile = { ...userProfileData,
          suiBalance: userProfileData.suiBalance || Math.random() * 100, 
          tokens: userProfileData.tokens || [], 
        };
        setAppUser(augmentedProfile);
      }
    } catch (error) { console.error("Failed in fetchAppUserProfile:", error.message); setAppUser(null); 
    } finally { setIsProfileLoading(false); }
  }, []); 
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    const savedTheme = localStorage.getItem('socialfi-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentWallet && currentWallet.address) { 
      fetchAppUserProfile(currentWallet.address);
    } else { 
      setAppUser(null); 
    }
  }, [currentWallet, fetchAppUserProfile]);


  useEffect(() => {
    const fetchPostsFromSupabase = async () => {
      setIsPostsLoading(true);
      let query = supabase.from('posts').select(`
        id, content, media_url, created_at, user_id,
        profiles:posts_user_id_fkey (id, username, display_name, avatar_url, sui_address),
        likes (user_id),
        comments_data:comments (count)
      `);

      if (activeFeedType === 'following' && appUser && appUser.id) {
        const { data: followedUsers, error: followError } = await supabase
          .from('follows').select('following_id').eq('follower_id', appUser.id);
        
        if (followError) {
          console.error("Error fetching followed users:", followError.message);
          setPosts([]); setIsPostsLoading(false); return;
        }
        
        const followedUserIds = followedUsers.map(f => f.following_id);

        if (followedUserIds.length === 0) {
          setPosts([]); setIsPostsLoading(false); return;
        }
        query = query.in('user_id', followedUserIds);
      } else if (activeFeedType === 'following' && (!appUser || !appUser.id)) {
        setPosts([]); setIsPostsLoading(false); return;
      }
      
      query = query.order('created_at', { ascending: false });

      try {
        const { data: supabasePosts, error: postsError } = await query;
        if (postsError) { throw postsError; }
        if (supabasePosts) {
          const formattedPosts = supabasePosts.map(post => {
            const authorProfile = post.profiles; 
            const currentUserLike = appUser && post.likes ? post.likes.find(like => like.user_id === appUser.id) : null;
            const commentCount = getCountSafely(post.comments_data);
            return {
              id: post.id, content: post.content, media: post.media_url,
              timestamp: new Date(post.created_at).toLocaleTimeString([], { day: 'numeric', month:'short', hour: '2-digit', minute: '2-digit' }),
              user: { id: authorProfile?.id, name: authorProfile?.display_name || authorProfile?.username || 'Unknown User',
                  username: authorProfile?.username || 'unknown_user',
                  avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorProfile?.sui_address || post.user_id}`,
                  sui_address: authorProfile?.sui_address,
              }, user_id: post.user_id, likes: post.likes?.length || 0, 
              isLikedByCurrentUser: !!currentUserLike, commentsCount: commentCount, 
              comments: [], areCommentsFetched: false, sharesCount: 0,
            };
          });
          setPosts(formattedPosts);
        }
      } catch (error) { console.error("Failed to fetch posts:", error.message); setPosts([]);
      } finally { setIsPostsLoading(false); }
    };
    fetchPostsFromSupabase(); 
  }, [appUser, activeFeedType]); 

  useEffect(() => { 
    if (!supabase) return;
    const handleNewPostSubscription = async (payload) => {
      const newPostFromSub = payload.new;
      let authorProfile = null;
      if (newPostFromSub.user_id) {
        try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles').select('id, username, display_name, avatar_url, sui_address')
              .eq('id', newPostFromSub.user_id).single();
            if (profileError && profileError.code !== 'PGRST116') { console.error("RT Post: Error fetching profile:", profileError.message);
            } else { authorProfile = profileData; }
        } catch(e) { console.error("RT Post: Exception fetching profile:", e); }
      }
      let isLikedByThisUser = false; 
      if (appUser && appUser.id === newPostFromSub.user_id) { /* ... */ }
      const displayPost = {
        id: newPostFromSub.id, content: newPostFromSub.content, media: newPostFromSub.media_url,
        timestamp: new Date(newPostFromSub.created_at).toLocaleTimeString([], { day: 'numeric', month:'short', hour: '2-digit', minute: '2-digit' }),
        user: { id: authorProfile?.id, name: authorProfile?.display_name || authorProfile?.username || 'Unknown User',
          username: authorProfile?.username || 'unknown_user',
          avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorProfile?.sui_address || newPostFromSub.user_id}`,
          sui_address: authorProfile?.sui_address,
        }, user_id: newPostFromSub.user_id, likes: 0, isLikedByCurrentUser: isLikedByThisUser,
        commentsCount: 0, comments: [], areCommentsFetched: true, sharesCount: 0,
      };
      setPosts(prevPosts => {
        if (prevPosts.find(p => p.id === newPostFromSub.id)) { return prevPosts; }
        if (activeFeedType === 'global' || 
            (activeFeedType === 'following' && appUser && appUser.id && displayPost.user_id && 
             appUser.following_ids?.includes(displayPost.user_id) 
            )
           ) {
             return [displayPost, ...prevPosts];
        }
        return prevPosts;
      });
    };
    const postChannel = supabase.channel('realtime-public-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handleNewPostSubscription)
      .subscribe((status, err) => { 
        if (status === 'SUBSCRIBED') { console.log('Successfully subscribed to new posts!'); }
        else if (status === 'CHANNEL_ERROR') { console.error('Subscription CHANNEL_ERROR on public:posts:', err); }
        else if (status === 'TIMED_OUT') { console.warn('Subscription TIMED_OUT on public:posts'); }
        else if (status === 'CLOSED') { console.log('Subscription CLOSED on public:posts'); }
        else { console.log('Subscription status on public:posts:', status, err); } 
      });
    return () => { if (postChannel) supabase.removeChannel(postChannel).catch(console.error); };
  }, [appUser, activeFeedType]); 

  useEffect(() => {
    if (!supabase) return; 
    const handleLikeChange = (payload) => {
      const { eventType, new: newLike, old: oldLikeRecord } = payload;
      const likeData = eventType === 'DELETE' ? oldLikeRecord : newLike;
      if (!likeData || !likeData.post_id || !likeData.user_id) { return; }
      setPosts(prevPosts => {
        const postIndex = prevPosts.findIndex(p => p.id === likeData.post_id);
        if (postIndex === -1) return prevPosts; 
        const targetPost = prevPosts[postIndex];
        let updatedLikesCount = targetPost.likes;
        let updatedIsLikedByCurrentUser = targetPost.isLikedByCurrentUser;
        if (eventType === 'INSERT') {
          updatedLikesCount = (targetPost.likes || 0) + 1;
          if (appUser && likeData.user_id === appUser.id) { updatedIsLikedByCurrentUser = true; }
        } else if (eventType === 'DELETE') {
          updatedLikesCount = Math.max(0, (targetPost.likes || 0) - 1);
          if (appUser && likeData.user_id === appUser.id) { updatedIsLikedByCurrentUser = false; }
        }
        if (appUser && likeData.user_id === appUser.id && targetPost.isLikedByCurrentUser === updatedIsLikedByCurrentUser && targetPost.likes === updatedLikesCount) {
            if(eventType === 'INSERT' && targetPost.likes !== updatedLikesCount) { /* allow update */ } else { return prevPosts; }
        }
        const updatedPostsArray = [...prevPosts];
        updatedPostsArray[postIndex] = { ...targetPost, likes: updatedLikesCount, isLikedByCurrentUser: updatedIsLikedByCurrentUser };
        return updatedPostsArray;
      });
    };
    const likesChannel = supabase.channel('realtime-public-likes-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, handleLikeChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'likes' }, handleLikeChange)
      .subscribe((status, err) => { 
        if (status === 'SUBSCRIBED') { console.log('Successfully subscribed to likes!'); }
        else if (status === 'CHANNEL_ERROR') { console.error('Subscription CHANNEL_ERROR on public:likes:', err); } 
        else { console.log('Subscription status on public:likes:', status, err); } 
       });
    return () => { if (likesChannel) supabase.removeChannel(likesChannel).catch(console.error); };
  }, [appUser]); 

  useEffect(() => {
    if (!supabase) return;
    const handleNewCommentSubscription = async (payload) => {
      const newCommentFromSub = payload.new;
      if (!newCommentFromSub || !newCommentFromSub.post_id || !newCommentFromSub.user_id) { return; }
      let authorProfile = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('id, username, display_name, avatar_url, sui_address')
          .eq('id', newCommentFromSub.user_id).single();
        if (profileError && profileError.code !== 'PGRST116') { console.error("RT Comment: Error fetching profile:", profileError.message); }
        else { authorProfile = profileData; }
      } catch(e) { console.error("RT Comment: Exception fetching profile:", e); }
      const formattedComment = {
        id: newCommentFromSub.id, content: newCommentFromSub.content,
        created_at: new Date(newCommentFromSub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: {
          id: authorProfile?.id, name: authorProfile?.display_name || authorProfile?.username || 'Unknown User',
          username: authorProfile?.username || 'unknown_user',
          avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorProfile?.sui_address || newCommentFromSub.user_id}`,
          sui_address: authorProfile?.sui_address,
        }
      };
      setPosts(prevPosts => {
        const postIndex = prevPosts.findIndex(p => p.id === newCommentFromSub.post_id);
        if (postIndex === -1) return prevPosts;
        const targetPost = prevPosts[postIndex];
        if (targetPost.comments && targetPost.comments.find(c => c.id === formattedComment.id)) { return prevPosts; }
        const updatedComments = [formattedComment, ...(targetPost.comments || [])];
        const updatedPostsArray = [...prevPosts];
        updatedPostsArray[postIndex] = { ...targetPost, comments: updatedComments, commentsCount: (targetPost.commentsCount || 0) + 1, areCommentsFetched: true };
        return updatedPostsArray;
      });
    };
    const commentsChannel = supabase.channel('realtime-public-comments-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, handleNewCommentSubscription)
      .subscribe((status, err) => { 
        if (status === 'SUBSCRIBED') { console.log('Successfully subscribed to comments!'); }
        else if (status === 'CHANNEL_ERROR') { console.error('Subscription CHANNEL_ERROR on public:comments:', err); } 
        else { console.log('Subscription status on public:comments:', status, err); } 
      });
    return () => { if (commentsChannel) supabase.removeChannel(commentsChannel).catch(console.error); };
  }, [appUser]); 

  const fetchUserNotifications = useCallback(async () => {
    if (!appUser || !appUser.id) return;
    console.log("Fetching notifications for user:", appUser.id);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, created_at, type, is_read, post_id, comment_id,
          actor:actor_user_id (id, username, display_name, avatar_url, sui_address),
          post:post_id (id, content),
          comment:comment_id (id, content)
        `)
        .eq('recipient_user_id', appUser.id)
        .order('created_at', { ascending: false })
        .limit(20); 
      if (error) throw error;
      if (data) {
        setUserNotifications(data);
        const unreadCount = data.filter(n => !n.is_read).length;
        setUnreadNotificationCount(unreadCount);
        console.log("Fetched notifications:", data.length, "Unread:", unreadCount);
      } else {
        setUserNotifications([]);
        setUnreadNotificationCount(0);
      }
    } catch (error) {
      console.error("Error fetching user notifications:", error.message);
      setUserNotifications([]);
      setUnreadNotificationCount(0);
    }
  }, [appUser]); 

  useEffect(() => {
    if (appUser && appUser.id) {
      fetchUserNotifications();
    } else {
      setUserNotifications([]); 
      setUnreadNotificationCount(0);
    }
  }, [appUser, fetchUserNotifications]); 

  useEffect(() => {
    if (!supabase || !appUser || !appUser.id) return;
    const handleNewNotification = async (payload) => {
      console.log('Realtime: New notification received!', payload.new);
      const newNotification = payload.new;

      let actorProfile = null;
      if (newNotification.actor_user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('id, username, display_name, avatar_url, sui_address')
          .eq('id', newNotification.actor_user_id).single();
        if (profileError && profileError.code !== 'PGRST116') { console.error("RT Notif: Error fetching actor profile:", profileError.message); }
        else { actorProfile = profileData; }
      }
      
      let postData = null;
      if (newNotification.post_id) {
          const {data: pData, error: pError} = await supabase
            .from('posts').select('content').eq('id', newNotification.post_id).single();
          if(!pError && pData) postData = pData;
      }
      let commentData = null;
      if (newNotification.comment_id) {
        const {data: cData, error: cError} = await supabase
            .from('comments').select('content').eq('id', newNotification.comment_id).single();
        if(!cError && cData) commentData = cData;
      }

      const formattedNotification = {
        ...newNotification,
        actor: actorProfile, 
        post: postData ? { id: newNotification.post_id, content: postData.content.substring(0,50) } : null,
        comment: commentData ? { id: newNotification.comment_id, content: commentData.content.substring(0,50) } : null,
      };
      
      setUserNotifications(prev => [formattedNotification, ...prev.slice(0, 19)]); 
      if (!newNotification.is_read) {
        setUnreadNotificationCount(prev => prev + 1);
      }
    };
    const notificationsChannel = supabase.channel(`realtime-user-notifications-${appUser.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${appUser.id}` },
        handleNewNotification
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') { console.log(`Successfully subscribed to notifications for user ${appUser.id}!`); }
        else if (status === 'CHANNEL_ERROR') { console.error(`Subscription CHANNEL_ERROR on notifications for user ${appUser.id}:`, err); } 
        else { console.log(`Subscription status on notifications for user ${appUser.id}:`, status, err); } 
      });
    return () => { if (notificationsChannel) supabase.removeChannel(notificationsChannel).catch(console.error); };
  }, [appUser]);

  const handleMarkNotificationAsRead = async (notificationId) => {
    if (!appUser || !notificationId) return;
    const notification = userNotifications.find(n => n.id === notificationId);
    const wasUnread = notification && !notification.is_read;
    setUserNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    if (wasUnread) {
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    }
    try {
      const { error } = await supabase
        .from('notifications').update({ is_read: true })
        .eq('id', notificationId).eq('recipient_user_id', appUser.id); 
      if (error) throw error;
    } catch (error) {
      console.error("Error marking notification as read:", error.message);
      if(wasUnread) {
        setUserNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n));
        setUnreadNotificationCount(prev => prev + 1);
      }
    }
  };
  
  const handleMarkAllNotificationsAsRead = async () => {
    if (!appUser || !appUser.id || unreadNotificationCount === 0) return;
    const oldNotifications = [...userNotifications];
    const oldUnreadCount = unreadNotificationCount;
    setUserNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadNotificationCount(0);
    try {
      const { error } = await supabase
        .from('notifications').update({ is_read: true })
        .eq('recipient_user_id', appUser.id).eq('is_read', false);
      if (error) throw error;
    } catch (error) {
        console.error("Error marking all notifications as read:", error.message);
        setUserNotifications(oldNotifications); 
        setUnreadNotificationCount(oldUnreadCount);
    }
  };

  const toggleTheme = () => { 
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('socialfi-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  const handleNavigation = (page, args = null) => { 
    setCurrentPage(page);
    setPageArgs(args);
    setIsMobileMenuOpen(false);
    setShowNotificationDropdown(false); 
    window.scrollTo(0, 0);
  };
  const handleUpdateUser = async (updatedProfileData) => { 
    if (!appUser || !appUser.sui_address) { alert("User not loaded. Cannot update."); return; }
    const userBeforeUpdate = { ...appUser }; 
    const profileUpdateForSupabase = {
        display_name: updatedProfileData.display_name, username: updatedProfileData.username,
        bio: updatedProfileData.bio, avatar_url: updatedProfileData.avatar_url,
        updated_at: new Date().toISOString() 
    };
    const newAppUserData = { ...appUser, ...updatedProfileData };
    setAppUser(newAppUserData); 
    try {
      const { data, error } = await supabase.from('profiles').update(profileUpdateForSupabase)
        .eq('sui_address', appUser.sui_address).select().single();
      if (error) { console.error("Error updating profile in Supabase:", error.message); setAppUser(userBeforeUpdate); 
                   alert(`Failed to update profile: ${error.message}. Please try again.`); return; }
      if (currentWallet && currentWallet.address) {
        await fetchAppUserProfile(currentWallet.address); 
      }
      if (userBeforeUpdate && (data.display_name !== userBeforeUpdate.display_name || data.username !== userBeforeUpdate.username || data.avatar_url !== userBeforeUpdate.avatar_url)) {
          setPosts(prevPosts => prevPosts.map(post => {
              if (post.user_id === userBeforeUpdate.id) { 
                  return { ...post, user: { ...post.user,
                      name: data.display_name || userBeforeUpdate.display_name, 
                      username: data.username || userBeforeUpdate.username,
                      avatar: data.avatar_url || userBeforeUpdate.avatar_url,
                  }};
              }
              return post;
          }));
      }
    } catch (error) { console.error("Catch block in handleUpdateUser:", error); setAppUser(userBeforeUpdate); alert("An unexpected error occurred during profile update.");}
  };
  
  const handleCreatePost = async (newPostData) => { 
    if (!appUser || !appUser.id) { alert("Please connect wallet and load profile to post."); return; }
    const postToInsert = { user_id: appUser.id, content: newPostData.content, media_url: newPostData.media_url || null };
    try {
      const { data: createdPostRow, error } = await supabase.from('posts').insert(postToInsert).select().single();
      if (error) { throw error; }
      const displayPost = {
        id: createdPostRow.id, content: createdPostRow.content, media: createdPostRow.media_url,
        timestamp: new Date(createdPostRow.created_at).toLocaleTimeString([], { day: 'numeric', month:'short', hour: '2-digit', minute: '2-digit' }),
        user: { id: appUser.id, name: appUser.display_name || appUser.username,
            username: appUser.username, avatar: appUser.avatar_url, sui_address: appUser.sui_address,
        }, user_id: appUser.id, 
        likes: 0, isLikedByCurrentUser: false, 
        commentsCount: 0, comments: [], areCommentsFetched: true, sharesCount: 0,
      };
      setPosts(prevPosts => {
        if (prevPosts.find(p => p.id === displayPost.id)) { return prevPosts; }
        return [displayPost, ...prevPosts];
      });
    } catch (error) { console.error("Error creating post in Supabase:", error.message); alert(`Failed to create post: ${error.message}`); }
  };

  const handleLikeToggle = async (postId) => { 
    if (!appUser || !appUser.id) { alert("Please connect your wallet to like posts."); return; }
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const postToUpdate = posts[postIndex];
    const postAuthorId = postToUpdate.user_id;
    const alreadyLiked = postToUpdate.isLikedByCurrentUser;
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, likes: alreadyLiked ? p.likes - 1 : p.likes + 1, isLikedByCurrentUser: !alreadyLiked } : p ));
    try {
      if (alreadyLiked) {
        const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: appUser.id });
        if (error) throw error; 
      } else {
        const { error: likeError } = await supabase.from('likes').insert({ post_id: postId, user_id: appUser.id });
        if (likeError) throw likeError; 
        if (postAuthorId && postAuthorId !== appUser.id) {
          const { error: notifError } = await supabase.from('notifications').insert({
            recipient_user_id: postAuthorId, actor_user_id: appUser.id, type: 'like', post_id: postId,
            metadata: { postContentSnippet: postToUpdate.content.substring(0, 50) }
          });
          if (notifError) console.error("Error creating like notification:", notifError);
        }
      }
    } catch (error) {
      console.error("Error toggling like in Supabase:", error.message);
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? postToUpdate : p)); 
      alert(`Failed to ${alreadyLiked ? 'unlike' : 'like'} post: ${error.message}`);
    }
  };

  const handleCreateComment = async (postId, commentContent) => {
    if (!appUser || !appUser.id) { alert("Please connect your wallet to comment."); return null; }
    if (!commentContent.trim()) { alert("Comment cannot be empty."); return null; }
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) { return null; }
    const postAuthorId = posts[postIndex].user_id;
    const commentToInsert = { post_id: postId, user_id: appUser.id, content: commentContent.trim() };
    try {
      const { data: createdComment, error } = await supabase.from('comments').insert(commentToInsert)
        .select(`*, profiles:comments_user_id_fkey (id, username, display_name, avatar_url, sui_address)`).single();
      if (error) { throw error; }
      const authorProfile = createdComment.profiles;
      const newCommentForUI = {
        id: createdComment.id, content: createdComment.content,
        created_at: new Date(createdComment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: { 
          id: authorProfile?.id, name: authorProfile?.display_name || authorProfile?.username,
          username: authorProfile?.username, avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorProfile?.sui_address || createdComment.user_id}`,
          sui_address: authorProfile?.sui_address,
        }
      };
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          if (post.comments && post.comments.find(c => c.id === newCommentForUI.id)) {
            return {...post, commentsCount: Math.max(post.commentsCount || 0, (post.comments || []).length)};
          }
          return { ...post,
            commentsCount: (post.commentsCount || 0) + 1,
            comments: [newCommentForUI, ...(post.comments || [])], 
            areCommentsFetched: true, 
          };
        }
        return post;
      }));
      if (postAuthorId && postAuthorId !== appUser.id) {
        const { error: notifError } = await supabase.from('notifications').insert({
          recipient_user_id: postAuthorId, actor_user_id: appUser.id, type: 'comment',
          post_id: postId, comment_id: createdComment.id,
          metadata: { commentSnippet: createdComment.content.substring(0, 50) }
        });
        if (notifError) console.error("Error creating comment notification:", notifError);
      }
      return newCommentForUI; 
    } catch (error) { console.error("Error creating comment:", error.message); alert(`Failed to post comment: ${error.message}`); return null; }
  };

  const fetchCommentsForPost = async (postId) => {
    try {
      const { data: fetchedComments, error } = await supabase
        .from('comments').select(`id, content, created_at, user_id, profiles:comments_user_id_fkey (id, username, display_name, avatar_url, sui_address)`)
        .eq('post_id', postId).order('created_at', { ascending: true }); 
      if (error) { throw error; }
      const formattedComments = fetchedComments.map(comment => {
        const authorProfile = comment.profiles;
        return { id: comment.id, content: comment.content, created_at: new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: { id: authorProfile?.id, name: authorProfile?.display_name || authorProfile?.username || 'Unknown User',
            username: authorProfile?.username || 'unknown_user',
            avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorProfile?.sui_address || comment.user_id}`,
            sui_address: authorProfile?.sui_address,
          }
        };
      });
      setPosts(prevPosts => prevPosts.map(post => (post.id === postId ? { ...post, comments: formattedComments, areCommentsFetched: true, commentsCount: formattedComments.length } : post)));
    } catch (error) { console.error(`Failed to fetch comments for post ${postId}:`, error.message); }
  };

  const handleFollow = async (targetUserId) => {
    if (!appUser || !appUser.id || !targetUserId || appUser.id === targetUserId) { return false; }
    try {
      const { error } = await supabase.from('follows').insert({ follower_id: appUser.id, following_id: targetUserId });
      if (error) {
        if (error.message.includes('duplicate key value violates unique constraint "follows_pkey"')) {
          if (currentWallet && currentWallet.address) { await fetchAppUserProfile(currentWallet.address); }
          return true; 
        }
        throw error;
      }
      if (currentWallet && currentWallet.address) { await fetchAppUserProfile(currentWallet.address); }
      const { error: notifError } = await supabase.from('notifications').insert({
        recipient_user_id: targetUserId, actor_user_id: appUser.id, type: 'follow'
      });
      if (notifError) console.error("Error creating follow notification:", notifError);
      return true;
    } catch (error) { console.error("Error following user:", error.message); alert(`Failed to follow: ${error.message}`); return false; }
  };

  const handleUnfollow = async (targetUserId) => {
    if (!appUser || !appUser.id || !targetUserId) { return false; }
    try {
      const { error } = await supabase.from('follows').delete().match({ follower_id: appUser.id, following_id: targetUserId });
      if (error) throw error;
      if (currentWallet && currentWallet.address) { await fetchAppUserProfile(currentWallet.address); }
      return true;
    } catch (error) { console.error("Error unfollowing user:", error.message); alert(`Failed to unfollow: ${error.message}`); return false; }
  };

  const handleCreateLaunchpadProject = (newProject) => { 
    setLaunchpadProjectsList(prevProjects => [newProject, ...prevProjects]);
    console.log("New launchpad project created (simulated):", newProject);
  };
  const handleTrade = (action, token, amount) => { 
    if (!appUser) { alert("Please connect wallet to trade."); return; }
    console.log(`Simulated trade: ${action} ${amount} of ${token.symbol} for user ${appUser.sui_address}`);
    alert(`This would ${action} ${amount} ${token.symbol}. Backend/SUI interaction needed.`);
  };
  const handleSendTransaction = (tokenSymbol, amount, recipientAddress) => { 
    if (!appUser) { alert("Please connect your wallet to send transactions."); return; }
    console.log(`Simulated send: ${amount} ${tokenSymbol} to ${recipientAddress} from ${appUser.sui_address}`);
    alert(`This would send ${amount} ${tokenSymbol} to ${recipientAddress}. Backend/SUI interaction needed.`);
  };
  const handleDisconnect = () => { 
    disconnectWallet();
    setAppUser(null); 
    handleNavigation('home');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'launchpad', label: 'Launchpad', icon: Rocket },
    { id: 'trading', label: 'Trade', icon: Repeat },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ];
  const combinedIsLoading = isLoading || (currentWallet && isProfileLoading); 

  if (combinedIsLoading) { 
    return ( 
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl font-semibold">Loading SocialFi Platform...</p>
        </div>
      </div>
    ); 
  }

  const renderPage = () => {
    const userPropsForPage = appUser ? { 
        ...appUser, 
        suiBalance: appUser.suiBalance || 0, 
        tokens: appUser.tokens || [],
        name: appUser.display_name || appUser.username || "SUI User",
        avatar: appUser.avatar_url || (appUser.sui_address ? `https://api.dicebear.com/7.x/identicon/svg?seed=${appUser.sui_address}` : "https://placehold.co/100x100/E2E8F0/4A5568?text=U")
    } : null;

    switch (currentPage) {
      case 'home':
        return <HomePage user={userPropsForPage} posts={posts} isPostsLoading={isPostsLoading} trendingTokens={trendingTokensList} launchpadProjects={launchpadProjectsList} onNavigate={handleNavigation} onPostCreate={handleCreatePost} onLikeToggle={handleLikeToggle} onCreateComment={handleCreateComment} onFetchComments={fetchCommentsForPost} activeFeedType={activeFeedType} setActiveFeedType={setActiveFeedType} />;
      case 'profile':
        return <ProfilePage appUser={userPropsForPage} profileSuiAddress={pageArgs?.suiAddress || appUser?.sui_address} allPosts={posts} isAppUserPostsLoading={isPostsLoading} onNavigate={handleNavigation} onLikeToggle={handleLikeToggle} onCreateComment={handleCreateComment} onFetchComments={fetchCommentsForPost} onFollow={handleFollow} onUnfollow={handleUnfollow} />;
      case 'launchpad':
        return <LaunchpadPage launchpadProjects={launchpadProjectsList} onNavigate={handleNavigation} onCreateLaunchpadProject={handleCreateLaunchpadProject} />;
      case 'trading':
        return <TradingPage user={userPropsForPage} trendingTokens={trendingTokensList} initialToken={pageArgs?.token} onTrade={handleTrade} />;
      case 'wallet':
        return userPropsForPage ? <WalletPage user={userPropsForPage} onNavigate={handleNavigation} onSendTransaction={handleSendTransaction}/> : <div className="p-6 text-center">Please connect wallet to view wallet.</div>;
      case 'settings':
        return userPropsForPage ? <SettingsPage user={userPropsForPage} onUpdateUser={handleUpdateUser} onToggleTheme={toggleTheme} currentTheme={theme} /> : <div className="p-6 text-center">Please connect wallet to view settings.</div>;
      default:
        return <HomePage user={userPropsForPage} posts={posts} isPostsLoading={isPostsLoading} trendingTokens={trendingTokensList} launchpadProjects={launchpadProjectsList} onNavigate={handleNavigation} onPostCreate={handleCreatePost} onLikeToggle={handleLikeToggle} onCreateComment={handleCreateComment} onFetchComments={fetchCommentsForPost} activeFeedType={activeFeedType} setActiveFeedType={setActiveFeedType} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span onClick={() => handleNavigation('home')} className="text-2xl font-bold text-blue-600 dark:text-blue-400 cursor-pointer flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path><path d="M12 12l4.24 4.24"></path><path d="M12 12l-4.24-4.24"></path><path d="M12 12l4.24-4.24"></path><path d="M12 12l-4.24 4.24"></path></svg>
                  Splash
                </span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-6">
                  {navItems.map((item) => (
                    <button key={item.id} onClick={() => handleNavigation(item.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentPage === item.id ? 'bg-blue-600 text-white dark:bg-blue-500' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                      <item.icon size={18} className="mr-1.5" /> {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                icon={Bell} 
                className="relative"
                onClick={() => setShowNotificationDropdown(prev => !prev)}
              >
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-0 right-0 block h-3 w-3 transform -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white dark:ring-gray-800 bg-red-500 text-white text-[0.6rem] flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </Button>
              <Button onClick={toggleTheme} variant="ghost" size="sm" icon={theme === 'dark' ? Moon : Sun} />
              {currentWallet && appUser && !isProfileLoading ? ( 
                <>
                  <Button onClick={() => handleNavigation('profile', { suiAddress: appUser.sui_address })} variant="ghost" size="sm" className="flex items-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <img className="h-8 w-8 rounded-full object-cover mr-2" src={appUser.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${appUser.sui_address}`} alt={appUser.display_name || appUser.username} />
                    <span className="text-sm font-medium hidden lg:block">{(appUser.display_name || appUser.username || 'User').split(' ')[0]}</span>
                  </Button>
                  <Button variant="ghost" size="sm" icon={Settings} onClick={() => handleNavigation('settings')} />
                  <Button variant="ghost" size="sm" icon={LogOut} onClick={handleDisconnect}>Disconnect</Button>
                </>
              ) : currentWallet && isProfileLoading ? (
                  <div className="text-sm text-gray-500 px-3">Loading...</div>
              ) : (
                <ConnectButton 
                  connectText="Connect Wallet"
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white !px-3 !py-1.5 !text-sm !font-medium !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-offset-2 focus:!ring-blue-500 dark:!focus:ring-offset-gray-800"
                />
              )}
            </div>
            <div className="flex md:hidden items-center">
                <Button onClick={toggleTheme} variant="ghost" size="sm" icon={theme === 'dark' ? Moon : Sun} className="mr-2" />
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? <CloseIcon className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                </button>
            </div>
          </div>
        </div>
    
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => {handleNavigation(item.id); setIsMobileMenuOpen(false);}} 
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center 
                    ${currentPage === item.id ? 'bg-blue-600 text-white dark:bg-blue-500' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  <item.icon size={20} className="mr-2" /> {item.label}
                </button>
              ))}
            </div>
            {currentWallet && appUser && !isProfileLoading ? (
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center px-5">
                  <img className="h-10 w-10 rounded-full object-cover" src={appUser.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${appUser.sui_address}`} alt={appUser.display_name || appUser.username} />
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none">{appUser.display_name || appUser.username}</div>
                    <div className="text-sm font-medium leading-none text-gray-500 dark:text-gray-400">@{appUser.username || (currentWallet && currentWallet.address ? currentWallet.address.substring(0,8) : '')}</div>
                  </div>
                  <Button variant="ghost" size="sm" icon={Bell} className="ml-auto relative" onClick={() => setShowNotificationDropdown(prev => !prev)}>
                    {unreadNotificationCount > 0 && (
                      <span className="absolute top-0 right-0 block h-3 w-3 transform -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white dark:ring-gray-800 bg-red-500 text-white text-[0.6rem] flex items-center justify-center">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </Button>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <button onClick={() => {handleNavigation('settings'); setIsMobileMenuOpen(false);}} 
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center">
                    <Settings size={20} className="mr-2"/> Settings
                  </button>
                  <button onClick={() => {handleDisconnect(); setIsMobileMenuOpen(false);}} 
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center">
                    <LogOut size={20} className="mr-2"/> Disconnect
                  </button>
                </div>
              </div>
            ) : currentWallet && isProfileLoading ? ( 
              <div className="px-2 pt-4 pb-3 text-center text-sm text-gray-500">Loading Profile...</div> 
            ) : ( 
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700 px-2">
                <ConnectButton 
                    connectText="Connect Wallet"
                    className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white !px-3 !py-2 !text-base !font-medium !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-offset-2 focus:!ring-blue-500 dark:!focus:ring-offset-gray-800"
                />
              </div> 
            )}
          </div>
        )}
      </nav>

      {showNotificationDropdown && appUser && (
        <div 
            className="fixed top-16 right-4 sm:right-6 lg:right-8 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 p-0 overflow-hidden"
            onMouseLeave={() => setShowNotificationDropdown(false)} 
        >
            <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                {userNotifications.length > 0 && unreadNotificationCount > 0 && (
                    <Button variant="link" size="sm" onClick={handleMarkAllNotificationsAsRead} className="text-xs !p-0">Mark all as read</Button>
                )}
            </div>
            {userNotifications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No notifications yet.</p>
            ) : (
                <div className="max-h-96 overflow-y-auto">
                    {userNotifications.map(notif => (
                        <div 
                            key={notif.id} 
                            className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notif.is_read ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                            onClick={() => {
                                handleMarkNotificationAsRead(notif.id);
                                if (notif.post_id) {
                                    handleNavigation('home'); // Placeholder, ideally navigate to specific post
                                } else if (notif.type === 'follow' && notif.actor?.sui_address) {
                                    handleNavigation('profile', { suiAddress: notif.actor.sui_address });
                                }
                                setShowNotificationDropdown(false);
                            }}
                        >
                            <div className="flex items-start space-x-3">
                                {notif.actor && (
                                    <img src={notif.actor.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${notif.actor.username || notif.actor.id}`} alt={notif.actor.username} className="w-8 h-8 rounded-full object-cover"/>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                        <span className="font-semibold">{notif.actor?.display_name || notif.actor?.username || 'Someone'}</span>
                                        {notif.type === 'like' && ` liked your post.`}
                                        {notif.type === 'comment' && ` commented on your post.`}
                                        {notif.type === 'follow' && ` started following you.`}
                                        {notif.metadata?.postContentSnippet && <span className="text-gray-500 dark:text-gray-400 block text-xs truncate italic">"{notif.metadata.postContentSnippet}..."</span>}
                                        {notif.metadata?.commentSnippet && <span className="text-gray-500 dark:text-gray-400 block text-xs truncate italic">"{notif.metadata.commentSnippet}..."</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        {new Date(notif.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {!notif.is_read && (
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-center flex-shrink-0"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
             {userNotifications.length > 0 && (
                <div className="p-2 text-center border-t dark:border-gray-700">
                    <Button variant="link" size="sm" onClick={() => { handleNavigation('notifications'); setShowNotificationDropdown(false);}} className="text-xs">View all notifications</Button>
                </div>
            )}
        </div>
      )}


      <main className="flex-grow">
        <div className="max-w-7xl mx-auto">
          {currentWallet && isProfileLoading && !appUser ? ( 
             <div className="p-6 text-center flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
                <svg className="animate-spin h-10 w-10 text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-medium">Loading user profile...</p>
             </div>
          ) : (!currentWallet && !['home', 'settings', 'launchpad', 'trading'].includes(currentPage) && currentPage !== 'profile' ) ? ( 
             <div className="p-6 text-center">
                <h2 className="text-2xl font-semibold mb-4">Please Connect Your Wallet</h2>
                <p className="mb-4">Connect your SUI wallet to access all features.</p>
                <div className="flex justify-center mt-4"> <ConnectButton /> </div>
             </div>
          ) : renderPage() }
        </div>
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400"> &copy; {new Date().getFullYear()} Splash Platform. All rights reserved. </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1"> Built for the SUI Network. By the community, for the community. </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
