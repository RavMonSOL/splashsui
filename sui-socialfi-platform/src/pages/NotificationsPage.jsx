// src/pages/NotificationsPage.jsx
import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button'; // Assuming you might want buttons later (e.g., clear all)
import { BellRing, CheckCircle } from 'lucide-react';

const NotificationsPage = ({ userNotifications, appUser, onNavigate, handleMarkNotificationAsRead }) => {
  if (!appUser) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Please connect your wallet to view notifications.
      </div>
    );
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkNotificationAsRead(notification.id);
    }
    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.post_id) {
        // For now, navigate to home. Later, could navigate to specific post.
        // To navigate to a specific post, you'd need a route like /post/:postId
        // and pass { postId: notification.post_id } to onNavigate.
        onNavigate('home'); 
      }
    } else if (notification.type === 'follow' && notification.actor?.sui_address) {
      onNavigate('profile', { suiAddress: notification.actor.sui_address });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <div className="flex items-center justify-between mb-6 pb-4 border-b dark:border-gray-700">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BellRing size={28} className="mr-3 text-blue-600 dark:text-blue-400" />
            Your Notifications
          </h1>
          {/* Placeholder for "Mark all as read" if unreadNotificationCount is also passed */}
        </div>

        {userNotifications.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            You have no notifications yet.
          </p>
        ) : (
          <div className="space-y-3">
            {userNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border dark:border-gray-700 cursor-pointer transition-colors duration-150
                            ${notif.is_read 
                                ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50' 
                                : 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-700'
                            }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-start space-x-3">
                  {notif.actor && (
                    <img
                      src={notif.actor.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${notif.actor.username || notif.actor.id}`}
                      alt={notif.actor.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-100">
                      <span className="font-semibold">{notif.actor?.display_name || notif.actor?.username || 'Someone'}</span>
                      {notif.type === 'like' && ` liked your post.`}
                      {notif.type === 'comment' && ` commented on your post.`}
                      {notif.type === 'follow' && ` started following you.`}
                    </p>
                    {notif.metadata?.postContentSnippet && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic truncate">
                        Post: "{notif.metadata.postContentSnippet}..."
                      </p>
                    )}
                    {notif.metadata?.commentSnippet && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic truncate">
                        Comment: "{notif.metadata.commentSnippet}..."
                      </p>
                    )}
                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                        {new Date(notif.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-start mt-1 flex-shrink-0" title="Unread"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
