// src/pages/HomePage.jsx
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Textarea from '../components/Textarea';
import { ThumbsUp, MessageSquare, Share2, PlusCircle, Shield, TrendingUp, Rocket } from 'lucide-react';

const HomePage = ({ user, posts, trendingTokens, launchpadProjects, onNavigate, onPostCreate }) => {
  const [newPostContent, setNewPostContent] = useState("");
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const handlePostSubmit = () => {
    if (newPostContent.trim() && user) {
      onPostCreate({
        id: `post${Date.now()}`,
        user: { name: user.name, username: user.username, avatar: user.avatar },
        content: newPostContent,
        timestamp: "Just now",
        likes: 0,
        comments: 0,
        shares: 0,
        tokenGated: false,
        media: null
      });
      setNewPostContent("");
      setShowCreatePostModal(false);
    }
  };
  
  if (!user) return <div>Loading user data...</div>; // Or some other placeholder

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white dark:from-blue-700 dark:to-indigo-800">
          <div className="flex items-center space-x-3">
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white" />
            <input
              type="text"
              placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
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

        {posts.map(post => (
          <Card key={post.id}>
            <div className="flex items-start space-x-3">
              <img src={post.user.avatar} alt={post.user.name} className="w-12 h-12 rounded-full" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{post.user.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">@{post.user.username} · {post.timestamp}</span>
                </div>
                {post.tokenGated && (
                  <div className="mt-1 flex items-center text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-full w-fit">
                    <Shield size={14} className="mr-1" />
                    Token Gated: Requires ${post.requiredToken}
                  </div>
                )}
                <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
            {post.media && <img src={post.media} alt="Post media" className="mt-3 rounded-lg w-full object-cover max-h-96" />}
            <div className="mt-4 flex justify-around items-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-3">
              <Button variant="ghost" size="sm" icon={ThumbsUp}>Like ({post.likes})</Button>
              <Button variant="ghost" size="sm" icon={MessageSquare}>Comment ({post.comments})</Button>
              <Button variant="ghost" size="sm" icon={Share2}>Share ({post.shares})</Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center"><TrendingUp className="mr-2 text-green-500"/>Trending Tokens</h3>
          <ul className="space-y-3">
            {trendingTokens.map(token => (
              <li key={token.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={() => onNavigate('trading', { token })}>
                <div className="flex items-center">
                  <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full mr-3" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{token.name} ({token.symbol})</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">${token.price}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${token.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{token.change}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center"><Rocket className="mr-2 text-indigo-500"/>Active Launches</h3>
           <ul className="space-y-3">
            {launchpadProjects.slice(0,2).map(project => (
              <li key={project.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={() => onNavigate('launchpad')}>
                <div className="flex items-center mb-1">
                    <img src={project.logo} alt={project.name} className="w-8 h-8 rounded-full mr-3" />
                    <p className="font-medium text-gray-800 dark:text-gray-100">{project.name}</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">{project.description}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(parseFloat(project.raised.replace(/,/g, '')) / parseFloat(project.goal.replace(/,/g, ''))) * 100}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{project.raised} / {project.goal} raised</p>
              </li>
            ))}
          </ul>
          <Button variant="ghost" className="w-full mt-3" onClick={() => onNavigate('launchpad')}>View All Launches</Button>
        </Card>
      </div>
      <Modal isOpen={showCreatePostModal} onClose={() => setShowCreatePostModal(false)} title="Create a new post">
        <Textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Share your thoughts, news, or launch a new idea..."
          rows={5}
        />
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={() => setShowCreatePostModal(false)}>Cancel</Button>
          <Button onClick={handlePostSubmit} disabled={!newPostContent.trim()}>Post</Button>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;