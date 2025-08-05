import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { BellRing, MailOpen } from 'lucide-react'; // Icons for unread/read

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationPopupProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void; // Added this prop
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="w-[340px] max-h-[400px] flex flex-col rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h4 className="text-lg font-semibold">Notifications ({unreadCount})</h4>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      <ScrollArea className="flex-grow">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No new notifications.
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer transition-colors duration-200",
                  notification.isRead ? "bg-popover hover:bg-muted/50" : "bg-green-500/10 hover:bg-green-500/20", // Soft green highlight for unread
                  "border-b border-border last:border-b-0"
                )}
                onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
              >
                {notification.isRead ? (
                  <MailOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <BellRing className="h-5 w-5 text-primary flex-shrink-0" />
                )}
                <div className="flex-grow">
                  <p className={cn(
                    "text-sm",
                    notification.isRead ? "text-muted-foreground font-normal" : "text-foreground font-bold"
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationPopup;