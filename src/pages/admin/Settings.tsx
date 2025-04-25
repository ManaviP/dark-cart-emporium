import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Settings = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and appearance
          </p>
        </div>
      </div>

      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Platform configuration and customization
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Site settings module will be available in the next update.
          </p>
          <Button variant="outline" asChild>
            <Link to="/admin">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
