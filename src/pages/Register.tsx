import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { ApiError } from '../api/types';
import { Lock, Mail, User, Phone, ArrowRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    document.title = 'Create Account · ShopSphere';
  }, []);

  // Live password checklist per spec §8
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8 && password.length <= 64,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  }, [password]);

  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      errors.firstName = 'First name must be between 2 and 50 characters';
    }
    if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      errors.lastName = 'Last name must be between 2 and 50 characters';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    if (!allPasswordChecksPassed) {
      errors.password = 'Password does not meet all security criteria';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      setSubmitting(true);
      await usersApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      toast.success('Account created successfully! Please sign in.');
      navigate('/login', { state: { email: email.trim() } });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 409) {
        setFieldErrors({ email: 'An account with this email already exists' });
      } else if (apiErr?.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      } else {
        toast.error(apiErr?.message || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-surface border border-line rounded-2xl shadow-xl p-8 relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-xl mx-auto mb-3 shadow-sm">
            S
          </div>
          <h1 className="font-headline-h2 text-2xl font-bold text-on-surface">
            Create Customer Account
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Access curated fashion drops & express dispatch
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Aarav"
                  className={`w-full h-10 pl-9 pr-3 text-xs bg-surface-container-low rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary text-on-surface ${
                    fieldErrors.firstName ? 'border-error' : 'border-line'
                  }`}
                />
              </div>
              {fieldErrors.firstName && (
                <span className="text-[11px] text-error mt-1 block">{fieldErrors.firstName}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Last Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sharma"
                  className={`w-full h-10 pl-9 pr-3 text-xs bg-surface-container-low rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary text-on-surface ${
                    fieldErrors.lastName ? 'border-error' : 'border-line'
                  }`}
                />
              </div>
              {fieldErrors.lastName && (
                <span className="text-[11px] text-error mt-1 block">{fieldErrors.lastName}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav.sharma@example.in"
                className={`w-full h-10 pl-9 pr-3 text-xs bg-surface-container-low rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary text-on-surface ${
                  fieldErrors.email ? 'border-error' : 'border-line'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <span className="text-[11px] text-error mt-1 block">{fieldErrors.email}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Phone Number (10 digits)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className={`w-full h-10 pl-9 pr-3 text-xs bg-surface-container-low rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary text-on-surface ${
                  fieldErrors.phone ? 'border-error' : 'border-line'
                }`}
              />
            </div>
            {fieldErrors.phone && (
              <span className="text-[11px] text-error mt-1 block">{fieldErrors.phone}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Password (8–64 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full h-10 pl-9 pr-3 text-xs bg-surface-container-low rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary text-on-surface ${
                  fieldErrors.password ? 'border-error' : 'border-line'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <span className="text-[11px] text-error mt-1 block">{fieldErrors.password}</span>
            )}

            {/* Live Security Checklist per spec §8 */}
            <div className="grid grid-cols-2 gap-1.5 mt-2.5 p-3 rounded-lg bg-surface-container-low border border-line text-[11px]">
              <span className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-success font-medium' : 'text-muted'}`}>
                {passwordChecks.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                8–64 characters
              </span>
              <span className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-success font-medium' : 'text-muted'}`}>
                {passwordChecks.uppercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                Uppercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-success font-medium' : 'text-muted'}`}>
                {passwordChecks.lowercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                Lowercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${passwordChecks.digit ? 'text-success font-medium' : 'text-muted'}`}>
                {passwordChecks.digit ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                Number (0-9)
              </span>
              <span className={`flex items-center gap-1.5 col-span-2 ${passwordChecks.special ? 'text-success font-medium' : 'text-muted'}`}>
                {passwordChecks.special ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                Special character (!@#$%^&*...)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted pointer-events-none" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full h-10 pl-9 pr-3 text-xs bg-surface-container-low rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary text-on-surface ${
                  fieldErrors.confirmPassword ? 'border-error' : 'border-line'
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="text-[11px] text-error mt-1 block">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg bg-primary text-on-primary font-caption-medium text-sm font-semibold hover:opacity-95 shadow-sm transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center text-xs text-on-surface-variant">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
