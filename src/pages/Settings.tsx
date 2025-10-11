import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Key, Settings as SettingsIcon, User , Lock} from "lucide-react";

const SettingsCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}> = ({ title, description, icon, link }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild className="w-full justify-between">
          <Link to={link}>
            Manage
            <ArrowRight size={16} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SettingsCard
          title="Account Settings"
          description="Manage your admin account details"
          icon={<User className="h-6 w-6 text-primary" />}
          link="/settings/account"
        />
        
        <SettingsCard
          title="Change Password"
          description="Update your admin password"
          icon={<Lock className="h-6 w-6 text-primary" />}
          link="/change-password"
        />
        
        <SettingsCard
          title="Site Settings"
          description="Manage website general settings"
          icon={<SettingsIcon className="h-6 w-6 text-primary" />}
          link="/settings/site"
        />
        <SettingsCard
          title="Api Keys"
          description="Manage website general settings"
          icon={<Key className="h-6 w-6 text-primary" />}
          link="/Api-keys"
        />
        <SettingsCard
          title="Social Media Settings"
          description="Manage your social media links and content"
          icon={<SettingsIcon className="h-6 w-6 text-primary" />}
          link="/settings/social-media"
        />
      </div>
    </div>
  );
};

export default Settings;
