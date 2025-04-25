import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Notifications = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notification Management</h1>
          <p className="text-muted-foreground">
            Send announcements and manage email notifications
          </p>
        </div>
      </div>

      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Send and manage platform notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Notification management module will be available in the next update.
          </p>
          <Button variant="outline" asChild>
            <Link to="/admin">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
