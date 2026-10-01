'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Check, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

function GithubIcon({ className = 'w-4 h-4' }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='currentColor'
			aria-hidden='true'
		>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
			/>
		</svg>
	);
}

export default function LoginPage() {
	const router = useRouter();
	const shouldReduceMotion = useReducedMotion();

	// Form State
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);

	// Interaction / Mode States
	const [forgotMode, setForgotMode] = useState(false);
	const [recoveryEmail, setRecoveryEmail] = useState('');
	const [recoverySent, setRecoverySent] = useState(false);

	// Status States
	const [isLoading, setIsLoading] = useState(false);
	const [isGithubLoading, setIsGithubLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [serverError, setServerError] = useState(null);
	const [successMsg, setSuccessMsg] = useState(null);

	// Validation
	const validateForm = () => {
		const newErrors = {};
		if (!email.trim()) {
			newErrors.email = 'Email address is required.';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			newErrors.email = 'Enter a valid email address (e.g. name@company.com).';
		}

		if (!password) {
			newErrors.password = 'Password is required.';
		} else if (password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters.';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validateRecovery = () => {
		const newErrors = {};
		if (!recoveryEmail.trim()) {
			newErrors.recoveryEmail = 'Email address is required to dispatch recovery.';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())) {
			newErrors.recoveryEmail = 'Enter a valid email address.';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Form Submission
	const handleLogin = async (e) => {
		e.preventDefault();
		setServerError(null);
		setSuccessMsg(null);

		if (!validateForm()) return;

		setIsLoading(true);

		// Realistic developer authentication simulation
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Simulation: test failure if using error demo trigger
			if (email.toLowerCase().includes('fail') || email.toLowerCase().includes('error')) {
				setServerError({
					title: 'AUTHENTICATION_FAILED',
					message: 'Invalid operator credentials provided for cluster gateway pool.',
					action: 'Verify your email and password, or use GitHub SSO.',
				});
				setIsLoading(false);
				return;
			}

			setSuccessMsg('Session authenticated. Initializing operator workspace...');
			setTimeout(() => {
				router.push('/');
			}, 900);
		} catch {
			setServerError({
				title: 'GATEWAY_TIMEOUT',
				message: 'Cluster authentication gateway did not respond within deadline.',
				action: 'Please reattempt the handshake momentarily.',
			});
			setIsLoading(false);
		}
	};

	// Forgot Password Submission
	const handleRecovery = async (e) => {
		e.preventDefault();
		setServerError(null);

		if (!validateRecovery()) return;

		setIsLoading(true);
		await new Promise((resolve) => setTimeout(resolve, 750));
		setIsLoading(false);
		setRecoverySent(true);
	};

	// GitHub OAuth Simulation
	const handleGithubAuth = async () => {
		setIsGithubLoading(true);
		setServerError(null);
		await new Promise((resolve) => setTimeout(resolve, 600));
		router.push('/callback');
	};

	return (
		<AuthShell
			mode='login'
			title={forgotMode ? 'Account Recovery' : 'Operator Sign In'}
			subtitle={
				forgotMode
					? 'Enter your registered identity to receive an authenticated password reset link.'
					: 'Access your KR0N control plane, active clusters, and deployment pipelines.'
			}
		>
			{/* Server / Validation Error Notice (DESIGN.md Section 34) */}
			<AnimatePresence>
				{serverError && (
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						role='alert'
						className='border border-[#ef4444]/40 bg-[#ef4444]/10 p-3.5 text-xs font-mono space-y-1'
					>
						<div className='flex items-center gap-2 text-[#ef4444] font-bold'>
							<AlertCircle size={14} />
							<span>ERROR // {serverError.title}</span>
						</div>
						<p className='text-[#F3F4F6] text-[11px] font-sans pl-5'>
							{serverError.message}
						</p>
						<div className='text-[#858C95] text-[10px] pl-5'>
							Action: {serverError.action}
						</div>
					</motion.div>
				)}

				{successMsg && (
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						role='status'
						className='border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs font-mono space-y-1'
					>
						<div className='flex items-center gap-2 text-emerald-400 font-bold'>
							<Check size={14} />
							<span>HANDSHAKE SUCCESSFUL</span>
						</div>
						<p className='text-[#F3F4F6] text-[11px] font-sans pl-5'>
							{successMsg}
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* NORMAL LOGIN FLOW */}
			{!forgotMode ? (
				<div className='space-y-6'>
					{/* Fast GitHub SSO Trigger */}
					<div>
						<button
							type='button'
							onClick={handleGithubAuth}
							disabled={isGithubLoading || isLoading}
							className='w-full border border-[#363D47] bg-[#111419] hover:bg-[#15191E] hover:border-white/40 text-white py-2.5 px-4 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group'
						>
							{isGithubLoading ? (
								<>
									<RefreshCw size={13} className='animate-spin text-white' />
									<span>CONNECTING TO GITHUB...</span>
								</>
							) : (
								<>
									<GithubIcon className='w-4 h-4 text-white group-hover:scale-105 transition-transform' />
									<span>CONTINUE WITH GITHUB</span>
									<span className='text-[10px] font-mono text-[#858C95] border border-[#242930] bg-[#090B0E] px-1.5 py-0.5 ml-auto hidden sm:inline'>
										SSO
									</span>
								</>
							)}
						</button>
					</div>

					{/* Subtle Horizontal Divider */}
					<div className='relative flex items-center justify-center'>
						<div className='absolute inset-0 flex items-center'>
							<div className='w-full border-t border-[#242930]' />
						</div>
						<div className='relative bg-[#0D1014] px-3 text-[10px] font-mono uppercase tracking-widest text-[#858C95]'>
							OR OPERATOR CREDENTIALS
						</div>
					</div>

					{/* Standard Email/Password Form */}
					<form onSubmit={handleLogin} noValidate className='space-y-4'>
						{/* Email Field */}
						<div className='space-y-1.5'>
							<div className='flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#C4C8CE]'>
								<label htmlFor='login-email' className='flex items-center gap-1.5'>
									<Mail size={12} className='text-[#858C95]' />
									<span>Work Email</span>
								</label>
								<span className='text-[10px] text-[#858C95] font-mono'>REQUIRED</span>
							</div>

							<div className='relative'>
								<input
									id='login-email'
									name='email'
									type='email'
									autoComplete='email'
									autoFocus
									disabled={isLoading}
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
									}}
									placeholder='operator@company.com'
									aria-invalid={!!errors.email}
									aria-describedby={errors.email ? 'login-email-error' : undefined}
									className={`w-full bg-[#090B0E] border ${
										errors.email ? 'border-[#ef4444]' : 'border-[#242930]'
									} hover:border-[#363D47] focus:border-white focus:ring-1 focus:ring-white/20 text-sm font-sans text-white px-3.5 py-2.5 outline-none transition-all placeholder:text-[#4E5560]`}
								/>
							</div>

							{errors.email && (
								<p id='login-email-error' role='alert' className='text-[11px] font-mono text-[#ef4444] pt-0.5'>
									{errors.email}
								</p>
							)}
						</div>

						{/* Password Field */}
						<div className='space-y-1.5'>
							<div className='flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#C4C8CE]'>
								<label htmlFor='login-password' className='flex items-center gap-1.5'>
									<Lock size={12} className='text-[#858C95]' />
									<span>Password</span>
								</label>

								<button
									type='button'
									onClick={() => {
										setForgotMode(true);
										setRecoveryEmail(email);
										setErrors({});
										setServerError(null);
									}}
									className='text-[10px] font-mono text-[#858C95] hover:text-white transition-colors underline-offset-4 hover:underline'
								>
									Forgot password?
								</button>
							</div>

							<div className='relative'>
								<input
									id='login-password'
									name='password'
									type={showPassword ? 'text' : 'password'}
									autoComplete='current-password'
									disabled={isLoading}
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
									}}
									placeholder='••••••••••••'
									aria-invalid={!!errors.password}
									aria-describedby={errors.password ? 'login-password-error' : undefined}
									className={`w-full bg-[#090B0E] border ${
										errors.password ? 'border-[#ef4444]' : 'border-[#242930]'
									} hover:border-[#363D47] focus:border-white focus:ring-1 focus:ring-white/20 text-sm font-mono text-white px-3.5 py-2.5 pr-10 outline-none transition-all placeholder:text-[#4E5560]`}
								/>

								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-[#858C95] hover:text-white transition-colors p-1'
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
								</button>
							</div>

							{errors.password && (
								<p id='login-password-error' role='alert' className='text-[11px] font-mono text-[#ef4444] pt-0.5'>
									{errors.password}
								</p>
							)}
						</div>

						{/* Remember Me Checkbox */}
						<div className='pt-1 flex items-center justify-between'>
							<label className='inline-flex items-center gap-2.5 cursor-pointer text-xs font-mono text-[#C4C8CE] select-none'>
								<input
									type='checkbox'
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
									className='w-3.5 h-3.5 rounded-none bg-[#090B0E] border border-[#363D47] text-white focus:ring-1 focus:ring-white/30 checked:bg-white checked:border-white accent-white transition-colors cursor-pointer'
								/>
								<span className='text-[11px] text-[#858C95] hover:text-[#C4C8CE]'>
									Trust this device for 30 days
								</span>
							</label>

							<span className='text-[10px] font-mono text-[#4E5560] uppercase tracking-wider hidden sm:inline'>
								TLS 1.3
							</span>
						</div>

						{/* Submit Primary Action */}
						<div className='pt-3'>
							<button
								type='submit'
								disabled={isLoading || isGithubLoading}
								className='clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-3 px-6 text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-lg hover:shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{isLoading ? (
									<>
										<RefreshCw size={13} className='animate-spin text-black' />
										<span>AUTHENTICATING SESSION...</span>
									</>
								) : (
									<>
										<span>SIGN IN TO KR0N</span>
										<ArrowRight size={13} />
									</>
								)}
							</button>
						</div>
					</form>

					{/* Navigation Prompt to Signup */}
					<div className='pt-4 text-center text-xs font-mono text-[#858C95]'>
						<span>New to the Kr0n platform? </span>
						<Link
							href='/signup'
							className='text-white hover:text-white/80 underline underline-offset-4 font-semibold uppercase tracking-wider'
						>
							Create workspace →
						</Link>
					</div>
				</div>
			) : (
				/* FORGOT PASSWORD RECOVERY FLOW */
				<div className='space-y-6'>
					{!recoverySent ? (
						<form onSubmit={handleRecovery} noValidate className='space-y-4'>
							<div className='space-y-1.5'>
								<label
									htmlFor='recovery-email'
									className='flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#C4C8CE]'
								>
									<Mail size={12} className='text-[#858C95]' />
									<span>Registered Work Email</span>
								</label>

								<input
									id='recovery-email'
									type='email'
									autoFocus
									disabled={isLoading}
									value={recoveryEmail}
									onChange={(e) => {
										setRecoveryEmail(e.target.value);
										if (errors.recoveryEmail) setErrors({});
									}}
									placeholder='operator@company.com'
									aria-invalid={!!errors.recoveryEmail}
									className={`w-full bg-[#090B0E] border ${
										errors.recoveryEmail ? 'border-[#ef4444]' : 'border-[#242930]'
									} hover:border-[#363D47] focus:border-white focus:ring-1 focus:ring-white/20 text-sm font-sans text-white px-3.5 py-2.5 outline-none transition-all placeholder:text-[#4E5560]`}
								/>

								{errors.recoveryEmail && (
									<p role='alert' className='text-[11px] font-mono text-[#ef4444] pt-0.5'>
										{errors.recoveryEmail}
									</p>
								)}
							</div>

							<div className='pt-2 space-y-3'>
								<button
									type='submit'
									disabled={isLoading}
									className='clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-3 px-6 text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
								>
									{isLoading ? (
										<>
											<RefreshCw size={13} className='animate-spin text-black' />
											<span>DISPATCHING RECOVERY PAYLOAD...</span>
										</>
									) : (
										<>
											<span>SEND RECOVERY LINK</span>
											<ArrowRight size={13} />
										</>
									)}
								</button>

								<button
									type='button'
									onClick={() => {
										setForgotMode(false);
										setErrors({});
										setServerError(null);
									}}
									className='w-full border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2.5 px-4 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2'
								>
									<ArrowLeft size={13} />
									<span>BACK TO SIGN IN</span>
								</button>
							</div>
						</form>
					) : (
						<div className='border border-emerald-500/30 bg-[#090B0E] p-5 space-y-4 font-mono'>
							<div className='flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider'>
								<Check size={16} />
								<span>RECOVERY PAYLOAD DISPATCHED</span>
							</div>

							<p className='text-xs text-[#C4C8CE] font-sans leading-relaxed'>
								We have dispatched an authenticated cryptographic reset token to{' '}
								<span className='text-white font-mono font-semibold'>{recoveryEmail}</span>. The
								one-time link will expire in 15 minutes.
							</p>

							<div className='pt-2'>
								<button
									type='button'
									onClick={() => {
										setForgotMode(false);
										setRecoverySent(false);
										setErrors({});
									}}
									className='clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 px-4 text-xs font-mono uppercase tracking-wider font-bold transition-all'
								>
									RETURN TO SIGN IN
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</AuthShell>
	);
}

