import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { User as UserIcon, Mail, Lock, Globe, Heart, Shield, Check, Save, Camera, Upload, Trash2, X } from 'lucide-react';
import { Category, Language } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, uploadAvatar, removeAvatar } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  const normalizeInterests = (interests?: (Category | string)[]): string[] => {
    if (!interests) return [];
    return interests.map((i) => (typeof i === 'string' ? i : i._id || i.id || ''));
  };

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(normalizeInterests(user?.interests));

  // Clean up object URL when component unmounts or previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state when user object loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPreferredLanguage(user.preferredLanguage || 'en');
      setSelectedInterests(normalizeInterests(user.interests));
    }
  }, [user]);

  // Handle local device image file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type: JPEG, PNG, WebP only. Reject SVG or arbitrary files.
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Unsupported file type. Please select a JPEG, PNG, or WebP image. SVG and arbitrary files are not supported.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size: 5MB limit
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('Image size exceeds 5 MB. Please select a smaller photo.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Revoke previous preview URL if any
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    showToast('Photo selected. Click "Save Photo" to apply.', 'info');
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) return;

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(selectedFile);
      showToast('Profile picture uploaded successfully!', 'success');
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refreshUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload profile picture';
      showToast(message, 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;

    setIsRemovingAvatar(true);
    try {
      await removeAvatar();
      showToast('Profile picture removed successfully.', 'success');
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refreshUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove profile picture';
      showToast(message, 'error');
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  // Fetch available languages
  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: () => apiClient.getLanguages()
  });

  // Fetch available categories for interests
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories()
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; preferredLanguage?: string; interests?: string[] }) =>
      apiClient.updateProfile(data),
    onSuccess: (updatedUser) => {
      showToast('Profile updated successfully!', 'success');
      refreshUser();
      queryClient.setQueryData(['currentUser'], updatedUser);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      showToast(message, 'error');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    updateProfileMutation.mutate({
      name: name.trim(),
      preferredLanguage,
      interests: selectedInterests
    });
  };

  const handleToggleInterest = (categoryId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please fill in both current and new password', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      showToast(message, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-750 mb-8">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={previewUrl || user.avatar} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <Badge variant={user.role === 'admin' ? 'danger' : 'secondary'} size="sm">
                {user.role.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm" className="capitalize">
            Status: {user.status}
          </Badge>
          <span className="text-xs text-slate-400">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-editorial-red" />
              <span>Personal Information</span>
            </h2>

            {/* Profile Picture Device Upload Section */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-750 bg-slate-50/70 dark:bg-navy-900/60 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Photo Preview */}
                <div className="relative group shrink-0">
                  <Avatar
                    name={user.name}
                    src={previewUrl || user.avatar}
                    size="xl"
                    className="w-24 h-24 text-xl ring-4 ring-white dark:ring-navy-800 shadow-md"
                  />
                  {previewUrl && (
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Preview
                    </span>
                  )}
                </div>

                {/* Upload & Action Controls */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile Photo</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {previewUrl
                        ? `New image ready: ${selectedFile?.name} (${Math.round((selectedFile?.size || 0) / 1024)} KB). Click "Save Photo" to apply.`
                        : 'Upload a portrait photo from your device. Supported: JPEG, PNG, WebP (max 5 MB).'}
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    {previewUrl ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveAvatar}
                          isLoading={isUploadingAvatar}
                          leftIcon={<Upload className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Save Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelPreview}
                          disabled={isUploadingAvatar}
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant={user.avatar ? 'outline' : 'primary'}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar || isRemovingAvatar}
                          leftIcon={<Camera className="w-3.5 h-3.5" />}
                        >
                          {user.avatar ? 'Replace Photo' : 'Upload Photo'}
                        </Button>

                        {user.avatar && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            isLoading={isRemovingAvatar}
                            disabled={isUploadingAvatar || isRemovingAvatar}
                            leftIcon={<Trash2 className="w-3.5 h-3.5 text-editorial-red" />}
                            className="text-editorial-red hover:bg-editorial-red/10 dark:hover:bg-editorial-red/20"
                          >
                            Remove Photo
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                leftIcon={<UserIcon className="w-4 h-4" />}
              />

              <Input
                label="Email Address"
                value={user.email}
                disabled
                helperText="Email address cannot be changed."
                leftIcon={<Mail className="w-4 h-4" />}
              />

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-editorial-red" />
                  <span>Preferred Reading Language</span>
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-editorial-red"
                >
                  {languages.length > 0 ? (
                    languages.map((lang) => (
                      <option key={lang._id} value={lang.code}>
                        {lang.name} ({lang.code.toUpperCase()}) {lang.isDefault ? '— Default' : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="en">English (EN)</option>
                      <option value="te">Telugu (TE)</option>
                      <option value="hi">Hindi (HI)</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default language for your personalized news view and notifications.
                </p>
              </div>

              {/* User Interests Foundation */}
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-editorial-red" />
                  <span>Topic Interests</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Select categories you follow to tailor your editorial dossier in future releases.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const catId = cat._id || cat.id || '';
                    const isSelected = selectedInterests.includes(catId);
                    return (
                      <button
                        key={catId}
                        type="button"
                        onClick={() => handleToggleInterest(catId)}
                        className={`flex items-center justify-between px-3 py-2 rounded text-xs font-semibold border transition-all text-left ${
                          isSelected
                            ? 'bg-editorial-red text-white border-editorial-red shadow-sm'
                            : 'bg-slate-50 dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-750 hover:border-slate-300 dark:hover:border-navy-600'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex justify-end">
                <Button
                  type="submit"
                  isLoading={updateProfileMutation.isPending}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Security & Password Card */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-editorial-red" />
              <span>Change Password</span>
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                disabled={isChangingPassword}
              />

              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                disabled={isChangingPassword}
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
                disabled={isChangingPassword}
              />

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                isLoading={isChangingPassword}
              >
                Update Password
              </Button>
            </form>
          </Card>

          {/* Account Overview Box */}
          <Card className="p-5 bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-750 text-xs space-y-2.5">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Account Credentials
            </h3>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-navy-800">
              <span className="text-slate-500">Access Level</span>
              <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{user.role}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-navy-800">
              <span className="text-slate-500">Account Status</span>
              <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">{user.status}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Security Model</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">JWT + Bcrypt (12 Rounds)</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
