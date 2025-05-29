// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Home, User, Rocket, Repeat, Wallet, Settings, Bell, Search, LogOut, Sun, Moon, Menu, X as CloseIcon } from 'lucide-react';
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


const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageArgs, setPageArgs] = useState(null);
  const [appUser, setAppUser] = useState(null); 
  const [posts, setPosts] = useState([]); 
  const trendingTokensList = initialTrendingTokensData; 
  const [launchpadProjectsList, setLaunchpadProjectsList] = useState(initialLaunchpadProjectsData);

  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const currentWallet = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  useEffect(() => { 
    const timer = setTimeout(() => setIsLoading(false), 300);
    const savedTheme = localStorage.getItem('socialfi-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { 
    const fetchOrCreateUserProfile = async (suiAddress) => {
      setIsProfileLoading(true);
      let userProfileData = null; 
      try {
        let { data: profile, error: fetchError } = await supabase
          .from('profiles').select('*').eq('sui_address', suiAddress).single();
        if (fetchError && fetchError.code !== 'PGRST116') { 
            console.error('Error fetching profile (excluding not found):', fetchError.message);
            if (fetchError.code !== 'PGRST116') throw fetchError;
        }
        if (profile) { 
          console.log("Found existing profile in Supabase:", profile);
          userProfileData = profile; 
        } else {
          console.log("No profile for address, creating new one:", suiAddress);
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
                console.log(`Username conflict, trying fallback: ${fallbackUsername}`);
                const { data: fallbackProfile, error: fallbackError } = await supabase
                    .from('profiles').insert({ ...newProfileToInsert, username: fallbackUsername }).select().single();
                if (fallbackError) { console.error("Error creating profile with fallback username:", fallbackError.message); throw fallbackError;}
                userProfileData = fallbackProfile;
                console.log("Created new profile with fallback username:", userProfileData);
            } else { console.error("Error creating profile:", insertError.message); throw insertError; }
          } else { 
            userProfileData = createdProfile; 
            console.log("Successfully created new profile in Supabase:", userProfileData);
          }
        }
        if (userProfileData) {
          const augmentedProfile = { ...userProfileData,
            suiBalance: userProfileData.suiBalance || Math.random() * 100, 
            tokens: userProfileData.tokens || initialTrendingTokensData.slice(0,Math.floor(Math.random()*2)+1).map(t=>({...t, id: t.id || `mock_${Math.random()}`, balance: Math.floor(Math.random()*100+10)})),
          };
          setAppUser(augmentedProfile);
        }
      } catch (error) { console.error("Failed in fetchOrCreateUserProfile catch block:", error.message, error); setAppUser(null); 
      } finally { setIsProfileLoading(false); }
    };
    if (currentWallet && currentWallet.address) { fetchOrCreateUserProfile(currentWallet.address);
    } else { setAppUser(null); }
  }, [currentWallet]);


  // Fetch posts from Supabase
  useEffect(() => {
    const fetchPostsFromSupabase = async () => {
      setIsPostsLoading(true);
      try {
        const { data: supabasePosts, error: postsError } = await supabase
          .from('posts')
          .select(`
            id, content, media_url, created_at, user_id,
            profiles:posts_user_id_fkey (id, username, display_name, avatar_url, sui_address),
            likes (user_id),
            comments_data:comments (count) 
          `)
          .order('created_at', { ascending: false });

        if (postsError) { 
          console.error("Error fetching posts from Supabase:", postsError.message); 
          throw postsError; 
        }

        if (supabasePosts) {
          const formattedPosts = supabasePosts.map(post => {
            const authorProfile = post.profiles; 
            const currentUserLike = appUser && post.likes ? post.likes.find(like => like.user_id === appUser.id) : null;
            const count = post.comments_data && post.comments_data.length > 0 ? post.comments_data[0].count : 0;
            return {
              id: post.id, content: post.content, media: post.media_url,
              timestamp: new Date(post.created_at).toLocaleTimeString([], { day: 'numeric', month:'short', hour: '2-digit', minute: '2-digit' }),
              user: {
                  id: authorProfile?.id, 
                  name: authorProfile?.display_name || authorProfile?.username || 'Unknown User',
                  username: authorProfile?.username || 'unknown_user',
                  avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorProfile?.sui_address || post.user_id}`,
                  sui_address: authorProfile?.sui_address,
              },
              user_id: post.user_id, 
              likes: post.likes?.length || 0, 
              isLikedByCurrentUser: !!currentUserLike, 
              commentsCount: count, 
              comments: [], 
              areCommentsFetched: false,
              sharesCount: 0,
            };
          });
          setPosts(formattedPosts);
          console.log("Fetched posts with comment counts:", formattedPosts);
        }
      } catch (error) { console.error("Failed to fetch posts:", error.message); setPosts([]);
      } finally { setIsPostsLoading(false); }
    };
    fetchPostsFromSupabase(); 
  }, [appUser]);


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
    console.log("Attempting to update Supabase with:", profileUpdateForSupabase);
    const newAppUserData = { ...appUser, ...updatedProfileData };
    setAppUser(newAppUserData); 
    try {
      const { data, error } = await supabase.from('profiles').update(profileUpdateForSupabase)
        .eq('sui_address', appUser.sui_address).select().single();
      if (error) { console.error("Error updating profile in Supabase:", error.message); setAppUser(userBeforeUpdate); 
                   alert(`Failed to update profile: ${error.message}. Please try again.`); return; }
      console.log("Profile successfully updated in Supabase, response data:", data);
      setAppUser(prev => ({ ...(prev || {}), ...data, 
        suiBalance: (prev || {}).suiBalance, tokens: (prev || {}).tokens,
      }));
      if (userBeforeUpdate && (data.display_name !== userBeforeUpdate.display_name || data.username !== userBeforeUpdate.username || data.avatar_url !== userBeforeUpdate.avatar_url)) {
          console.log("Profile details changed, updating posts' user info...");
          setPosts(prevPosts => prevPosts.map(post => {
              if (post.user_id === userBeforeUpdate.id) { 
                  console.log("Updating post user details for post ID:", post.id);
                  return { ...post, user: { ...post.user,
                      name: data.display_name || userBeforeUpdate.display_name, 
                      username: data.username || userBeforeUpdate.username,
                      avatar: data.avatar_url || userBeforeUpdate.avatar_url,
                      sui_address: data.sui_address,
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
      const { data: createdPost, error } = await supabase.from('posts').insert(postToInsert)
        .select(`*, profiles:posts_user_id_fkey (id, username, display_name, avatar_url, sui_address)`).single();
      if (error) { throw error; }
      const authorProfile = createdPost.profiles; 
      const displayPost = {
        id: createdPost.id, content: createdPost.content, media: createdPost.media_url,
        timestamp: new Date(createdPost.created_at).toLocaleTimeString([], { day: 'numeric', month:'short', hour: '2-digit', minute: '2-digit' }),
        user: { id: authorProfile?.id, name: authorProfile?.display_name || authorProfile?.username,
            username: authorProfile?.username, avatar: authorProfile?.avatar_url, sui_address: authorProfile?.sui_address,
        }, user_id: createdPost.user_id, 
        likes: 0, isLikedByCurrentUser: false, 
        commentsCount: 0, 
        comments: [],     
        areCommentsFetched: true,
        sharesCount: 0,
      };
      setPosts(prevPosts => [displayPost, ...prevPosts]);
    } catch (error) { console.error("Error creating post in Supabase:", error.message); alert(`Failed to create post: ${error.message}`); }
  };

  const handleLikeToggle = async (postId) => { 
    if (!appUser || !appUser.id) { alert("Please connect your wallet to like posts."); return; }
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const postToUpdate = posts[postIndex];
    const alreadyLiked = postToUpdate.isLikedByCurrentUser;
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = { ...postToUpdate,
      likes: alreadyLiked ? postToUpdate.likes - 1 : postToUpdate.likes + 1,
      isLikedByCurrentUser: !alreadyLiked,
    };
    setPosts(updatedPosts);
    try {
      if (alreadyLiked) {
        const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: appUser.id });
        if (error) throw error; console.log(`Post ${postId} unliked by user ${appUser.id}`);
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: appUser.id });
        if (error) throw error; console.log(`Post ${postId} liked by user ${appUser.id}`);
      }
    } catch (error) {
      console.error("Error toggling like in Supabase:", error.message);
      setPosts(prevPosts => { 
        const revertedPosts = [...prevPosts];
        revertedPosts[postIndex] = postToUpdate; return revertedPosts;
      });
      alert(`Failed to ${alreadyLiked ? 'unlike' : 'like'} post: ${error.message}`);
    }
  };

  const handleCreateComment = async (postId, commentContent) => {
    if (!appUser || !appUser.id) { alert("Please connect your wallet to comment."); return null; }
    if (!commentContent.trim()) { alert("Comment cannot be empty."); return null; }
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
          return { ...post,
            commentsCount: (post.commentsCount || 0) + 1,
            comments: [newCommentForUI, ...(post.comments || [])], 
            areCommentsFetched: true, 
          };
        }
        return post;
      }));
      console.log("Comment created and optimistically added:", newCommentForUI);
      return newCommentForUI; 
    } catch (error) { console.error("Error creating comment:", error.message); alert(`Failed to post comment: ${error.message}`); return null; }
  };

  const fetchCommentsForPost = async (postId) => {
    console.log(`Fetching comments for post ID: ${postId}`);
    try {
      const { data: fetchedComments, error } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id,
          profiles:comments_user_id_fkey (id, username, display_name, avatar_url, sui_address)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true }); 

      if (error) {
        console.error(`Error fetching comments for post ${postId}:`, error.message);
        throw error;
      }

      const formattedComments = fetchedComments.map(comment => {
        const authorProfile = comment.profiles;
        return {
          id: comment.id,
          content: comment.content,
          created_at: new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: {
            id: authorProfile?.id,
            name: authorProfile?.display_name || authorProfile?.username || 'Unknown User',
            username: authorProfile?.username || 'unknown_user',
            avatar: authorProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorProfile?.sui_address || comment.user_id}`,
            sui_address: authorProfile?.sui_address,
          }
        };
      });

      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: formattedComments,
            areCommentsFetched: true, 
            commentsCount: formattedComments.length 
          };
        }
        return post;
      }));
      console.log(`Successfully fetched ${formattedComments.length} comments for post ${postId}`);
    } catch (error) {
      console.error(`Failed to fetch comments for post ${postId}:`, error);
    }
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
    if (!appUser) { alert("Please connect wallet to send transactions."); return; }
    console.log(`Simulated send: ${amount} ${tokenSymbol} to ${recipientAddress} from ${appUser.sui_address}`);
    alert(`This would send ${amount} ${tokenSymbol} to ${recipientAddress}. Backend/SUI interaction needed.`);
  };
  const handleDisconnect = () => { 
    disconnectWallet();
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
        return <HomePage user={userPropsForPage} posts={posts} isPostsLoading={isPostsLoading} trendingTokens={trendingTokensList} launchpadProjects={launchpadProjectsList} onNavigate={handleNavigation} onPostCreate={handleCreatePost} onLikeToggle={handleLikeToggle} onCreateComment={handleCreateComment} onFetchComments={fetchCommentsForPost} />;
      case 'profile':
        return userPropsForPage ? <ProfilePage user={userPropsForPage} allPosts={posts} isPostsLoading={isPostsLoading} onNavigate={handleNavigation} onLikeToggle={handleLikeToggle} onCreateComment={handleCreateComment} onFetchComments={fetchCommentsForPost} appUserId={appUser?.id} /> : <div className="p-6 text-center">Please connect wallet to view profile.</div>;
      case 'launchpad':
        return <LaunchpadPage launchpadProjects={launchpadProjectsList} onNavigate={handleNavigation} onCreateLaunchpadProject={handleCreateLaunchpadProject} />;
      case 'trading':
        return <TradingPage user={userPropsForPage} trendingTokens={trendingTokensList} initialToken={pageArgs?.token} onTrade={handleTrade} />;
      case 'wallet':
        return userPropsForPage ? <WalletPage user={userPropsForPage} onNavigate={handleNavigation} onSendTransaction={handleSendTransaction}/> : <div className="p-6 text-center">Please connect wallet to view wallet.</div>;
      case 'settings':
        return userPropsForPage ? <SettingsPage user={userPropsForPage} onUpdateUser={handleUpdateUser} onToggleTheme={toggleTheme} currentTheme={theme} /> : <div className="p-6 text-center">Please connect wallet to view settings.</div>;
      default:
        return <HomePage user={userPropsForPage} posts={posts} isPostsLoading={isPostsLoading} trendingTokens={trendingTokensList} launchpadProjects={launchpadProjectsList} onNavigate={handleNavigation} onPostCreate={handleCreatePost} onLikeToggle={handleLikeToggle} onCreateComment={handleCreateComment} onFetchComments={fetchCommentsForPost} />;
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
                  SuiSocial
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
              <Button variant="ghost" size="sm" icon={Bell} className="relative">
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-800 bg-red-500" />
              </Button>
              <Button onClick={toggleTheme} variant="ghost" size="sm" icon={theme === 'dark' ? Moon : Sun} />
              
              {currentWallet && appUser && !isProfileLoading ? ( 
                <>
                  <Button onClick={() => handleNavigation('profile')} variant="ghost" size="sm" className="flex items-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
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
                  <Button variant="ghost" size="sm" icon={Bell} className="ml-auto relative">
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-800 bg-red-500" />
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
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto">
          {currentWallet && isProfileLoading ? (
             <div className="p-6 text-center flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
                <svg className="animate-spin h-10 w-10 text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-medium">Loading user profile...</p>
             </div>
          ) : (!currentWallet && !['home', 'settings', 'launchpad', 'trading'].includes(currentPage)) ? ( 
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
          <p className="text-sm text-gray-500 dark:text-gray-400"> &copy; {new Date().getFullYear()} SuiSocialFi Platform. All rights reserved. </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1"> Built for the SUI Network. This is a UI concept. </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
