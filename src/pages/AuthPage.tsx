import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Leaf, ArrowRight, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { login, signup, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already logged in
    React.useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(name, email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        y: [-20, 20, -20],
                        rotate: [0, 5, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl opacity-60"
                />
                <motion.div
                    animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 right-20 text-primary/20"
                >
                    <Leaf size={140} />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-10 left-10 text-accent/10"
                >
                    <Leaf size={180} />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft border border-white/60 relative z-10 overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 pb-6 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 rotate-3"
                    >
                        <Leaf className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Grinify</h1>
                    <p className="text-text-light font-medium">Small steps. Big impact. 🌿</p>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-gray-100/50">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 pb-4 text-sm font-semibold transition-colors relative ${isLogin ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Log In
                        {isLogin && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 pb-4 text-sm font-semibold transition-colors relative ${!isLogin ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Sign Up
                        {!isLogin && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"
                            />
                        )}
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 pt-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={isLogin ? 'login' : 'signup'}
                            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="relative group"
                                >
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all duration-300"
                                        required={!isLogin}
                                    />
                                </motion.div>
                            )}

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all duration-300"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all duration-300"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-hover shadow-lg shadow-primary/20 h-12 text-base font-semibold rounded-xl"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {isLogin ? 'Welcome Back' : 'Create Account'}
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>

                        </motion.form>
                    </AnimatePresence>

                    <p className="mt-8 text-center text-xs text-text-light/80">
                        By continuing, you agree to our Terms of Service & Privacy Policy.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
