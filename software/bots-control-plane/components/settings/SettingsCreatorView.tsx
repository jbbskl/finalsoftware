"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, User, Building, Bell } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  vat_id?: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsCreatorView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company_name: "",
    vat_id: "",
    notifications_enabled: true,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when backend is implemented
      // const response = await fetch('/api/user/profile');
      // const data = await response.json();
      
      // Mock data for now
      const mockProfile: UserProfile = {
        id: "user_123",
        name: "John Creator",
        email: "john@example.com",
        company_name: "Creator Co.",
        vat_id: "NL123456789B01",
        notifications_enabled: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      };
      
      setProfile(mockProfile);
      setFormData({
        name: mockProfile.name,
        email: mockProfile.email,
        company_name: mockProfile.company_name || "",
        vat_id: mockProfile.vat_id || "",
        notifications_enabled: mockProfile.notifications_enabled,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // TODO: Replace with actual API call when backend is implemented
      // const response = await fetch('/api/user/profile', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to save profile');
      // }
      
      // Mock save for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Profile updated successfully");
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          ...formData,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!profile) return false;
    return (
      formData.name !== profile.name ||
      formData.email !== profile.email ||
      formData.company_name !== (profile.company_name || "") ||
      formData.vat_id !== (profile.vat_id || "") ||
      formData.notifications_enabled !== profile.notifications_enabled
    );
  };

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Your basic profile information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                <CardTitle>Company Information</CardTitle>
              </div>
              <CardDescription>
                Optional company details used for invoicing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="space-y-2">
                <Label>VAT ID</Label>
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges() || saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Your basic profile information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            
            {profile && (
              <div className="text-sm text-muted-foreground">
                <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
                <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>
              Optional company details used for invoicing and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Enter company name"
                />
                <p className="text-sm text-muted-foreground">
                  This will appear on your invoices
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_id">VAT ID</Label>
                <Input
                  id="vat_id"
                  value={formData.vat_id}
                  onChange={(e) => handleInputChange("vat_id", e.target.value)}
                  placeholder="Enter VAT ID (e.g., NL123456789B01)"
                />
                <p className="text-sm text-muted-foreground">
                  Required for EU businesses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about bot runs, errors, and system updates
                </p>
              </div>
              <Switch
                id="notifications"
                checked={formData.notifications_enabled}
                onCheckedChange={(checked) => handleInputChange("notifications_enabled", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and subscription information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <p className="font-mono">{profile?.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="capitalize">Creator</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Subscription</Label>
                <p>Creator Plan</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Bot Limit</Label>
                <p>6 Creator Bots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Changes Button (sticky at bottom) */}
      <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges() || saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}