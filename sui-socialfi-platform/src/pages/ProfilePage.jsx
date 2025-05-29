// src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { MessageSquare, Wallet, Activity, ThumbsUp, Share2 } from 'lucide-react';

const ProfilePage = ({ user, posts, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('posts');

  if (!user) return <div>Loading user data...</div>; // Or some other placeholder

  const userPosts = posts.filter(post => post.user.username === user.username);

  return (
    <div className="p-4 sm:p-6">
      <Card className="mb-6 overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-700 dark:to-blue-700 relative">
            <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 shadow-lg"
            />
        </div>
        <div className="pt-16 sm:pt-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 max-w-md mx-auto px-4">{user.bio}</p>
        </div>
        <div className="flex justify-center space-x-4 sm:space-x-8 mt-4 pb-6 border-b dark:border-gray-700">
          <div className="text-center">
            <p className="font-semibold text-lg text-gray-900 dark:text-white">{userPosts.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg text-gray-900 dark:text-white">{user.followers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg text-gray-900 dark:text-white">{user.following}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
          </div>
        </div>
        <div className="flex justify-center mt-4 mb-2">
            <Button variant="primary" onClick={() => onNavigate('settings')}>Edit Profile</Button>
        </div>
      </Card>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 justify-center" aria-label="Tabs">
          {['posts', 'tokens', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base capitalize flex items-center`}
            >
              {tab === 'posts' && <MessageSquare size={18} className="mr-2"/>}
              {tab === 'tokens' && <Wallet size={18} className="mr-2"/>}
              {tab === 'activity' && <Activity size={18} className="mr-2"/>}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Posts</h3>
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <Card key={post.id}>
                  <div className="flex items-start space-x-3">
                    <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{post.user.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">@{post.user.username} · {post.timestamp}</span>
                      </div>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{post.content}</p>
                    </div>
                  </div>
                  {post.media && <img src={post.media} alt="Post media" className="mt-2 rounded-lg w-full" />}
                   <div className="mt-3 flex justify-around items-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2 text-sm">
                      <Button variant="ghost" size="sm" icon={ThumbsUp}>Like ({post.likes})</Button>
                      <Button variant="ghost" size="sm" icon={MessageSquare}>Comment ({post.comments})</Button>
                      <Button variant="ghost" size="sm" icon={Share2}>Share ({post.shares})</Button>
                    </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-8">
                <MessageSquare size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">You haven't made any posts yet.</p>
                <Button className="mt-4" onClick={() => onNavigate('home')}>Make your first post</Button>
              </Card>
            )}
          </div>
        )}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Tokens</h3>
            {user.tokens && user.tokens.length > 0 ? (
              user.tokens.map(token => (
                <Card key={token.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={token.logo} alt={token.name} className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{token.name} ({token.symbol})</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance: {token.balance.toLocaleString()} {token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="font-semibold text-gray-900 dark:text-white">${(token.balance * token.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Price: ${token.price}</p>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-8">
                <Wallet size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">You don't hold any community tokens yet.</p>
                <Button className="mt-4" onClick={() => onNavigate('trading')}>Explore Tokens</Button>
              </Card>
            )}
          </div>
        )}
        {activeTab === 'activity' && (
          <Card className="text-center py-8">
            <Activity size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Recent Activity</h3>
            <p className="text-gray-500 dark:text-gray-400">Your recent interactions and notifications will appear here.</p>
            <ul className="mt-4 text-left space-y-2 max-w-md mx-auto">
                <li className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">Liked Vitalik's post about SUI.</li>
                <li className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">Commented on Gavin's token launch.</li>
                <li className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">Started following @SuiDev.</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;