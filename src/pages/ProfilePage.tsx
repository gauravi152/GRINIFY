import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Award, Shield, Moon, Sun, Camera, Save, X, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const ProfilePage: React.FC = () => {
    const { user, updateProfile, uploadAvatar } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        location: user?.location || '',
        gender: user?.gender || '',
        birthdate: user?.birthdate || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Sync formData when user shifts from null to data (post-hydration)
    React.useEffect(() => {
        if (user && !isEditing) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                location: user.location || '',
                gender: user.gender || '',
                birthdate: user.birthdate || '',
            });
        }
    }, [user, isEditing]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                name: formData.name,
                email: formData.email,
                location: formData.location,
                gender: formData.gender,
                birthdate: formData.birthdate,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            setIsEditing(false);
        } catch (err) {
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Show local preview first
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result as string);
                };
                reader.readAsDataURL(file);

                // Upload to backend
                await uploadAvatar(file);

                // Clear preview once backend URL is available via context
                setPreviewImage(null);
            } catch (err) {
                alert("Failed to upload image.");
            }
        }
    };

    const stats = [
        { label: 'Eco Points', value: user?.points?.toLocaleString() || '0', icon: Award, color: 'text-primary' },
        { label: 'Impact Level', value: user?.rank || 'Explorer', icon: Shield, color: 'text-secondary' },
        { label: 'Items Scanned', value: user?.scans?.toString() || '0', icon: Camera, color: 'text-accent' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text dark:text-dark-text tracking-tight">Your Profile</h1>
                <p className="text-text-light mt-1">Manage your personal information and settings.</p>
            </header>

            {/* Profile Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-dark-surface rounded-3xl p-8 shadow-soft border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                {/* Avatar Section */}
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-dark-surface shadow-lg overflow-hidden relative">
                        <img
                            src={previewImage || user?.avatar || ""}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                        {isEditing && (
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left space-y-2 z-10 w-full">
                    {isEditing ? (
                        <div className="space-y-4 max-w-sm">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-light uppercase tracking-wider">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="text-xl font-bold text-text dark:text-dark-text w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-light uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="text-lg text-text dark:text-dark-text w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Email Address"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-text-light uppercase tracking-wider">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="text-lg text-text dark:text-dark-text w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Location"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-text-light uppercase tracking-wider">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="text-sm text-text dark:text-dark-text w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-text-light uppercase tracking-wider">Birthdate</label>
                                    <input
                                        type="date"
                                        value={formData.birthdate}
                                        onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                        className="text-sm text-text dark:text-dark-text w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-text dark:text-dark-text">{user?.name}</h2>
                            <p className="text-text-light flex items-center justify-center md:justify-start gap-2">
                                <Mail size={16} /> {user?.email}
                            </p>
                            <p className="text-text-light flex items-center justify-center md:justify-start gap-2">
                                <MapPin size={16} /> {user?.location || 'Add location'}
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-2">
                                {user?.gender && (
                                    <p className="text-sm text-text-light flex items-center gap-2">
                                        <span className="font-semibold text-text/80">Gender:</span> {user.gender}
                                    </p>
                                )}
                                {user?.birthdate && (
                                    <p className="text-sm text-text-light flex items-center gap-2">
                                        <span className="font-semibold text-text/80">Birthdate:</span> {new Date(user.birthdate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 self-center md:self-start">
                    {isEditing ? (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => { setIsEditing(false); setPreviewImage(null); }}
                                variant="outline"
                                className="bg-white dark:bg-dark-surface hover:bg-red-50 hover:text-red-600 border-gray-200 dark:border-gray-700"
                                disabled={isSaving}
                            >
                                <X size={18} className="mr-2" /> Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-primary text-white shadow-lg shadow-primary/20"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Changes</>}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button onClick={() => setIsEditing(true)} variant="outline" className="bg-white dark:bg-dark-surface dark:text-dark-text dark:border-gray-700 hover:bg-gray-50">
                                <Edit2 size={18} className="mr-2" /> Edit Profile
                            </Button>
                            {saveSuccess && (
                                <motion.p
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-green-600 text-sm font-semibold text-center md:text-left"
                                >
                                    Changes saved successfully!
                                </motion.p>
                            )}
                        </>
                    )}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-light">{stat.label}</p>
                            <p className="text-xl font-bold text-text dark:text-dark-text">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Settings Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-text dark:text-dark-text">Preferences</h3>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-text dark:text-dark-text">
                                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                            </div>
                            <div>
                                <p className="font-semibold text-text dark:text-dark-text">Appearance</p>
                                <p className="text-sm text-text-light">Toggle between light and dark themes</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-300 shadow-sm ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
