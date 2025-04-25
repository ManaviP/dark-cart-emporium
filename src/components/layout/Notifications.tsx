import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/services/trackingService";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(
        notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Format notification time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Handle popover open change
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    // Mark notifications as read when popover is closed
    if (!newOpen && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 text-xs"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] p-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-muted/50 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {notification.type === 'view' && (
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Bell className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                      {notification.type === 'cart' && (
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <Bell className="h-4 w-4 text-orange-500" />
                        </div>
                      )}
                      {notification.type === 'purchase' && (
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Bell className="h-4 w-4 text-purple-500" />
                        </div>
                      )}
                      {notification.type === 'donation' && (
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Bell className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
