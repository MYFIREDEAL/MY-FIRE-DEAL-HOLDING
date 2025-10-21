
import React, { useState } from "react";
import { LogIn, Mail, Lock, UserPlus } from "lucide-react";
import { supabase } from "../supabaseClient";

const MODES = {
  signin: {
    title: 'Se connecter',
    actionLabel: 'Connexion',
    switchLabel: "Pas encore de compte ?",
    switchAction: 'Créer un compte',
  },
  signup: {
    title: 'Créer un compte',
    actionLabel: 'Créer le compte',
    switchLabel: 'Déjà inscrit ?',
    switchAction: 'Se connecter',
  },
};

export default function LoginPage() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);
    const siteUrl =
      import.meta.env.VITE_SITE_URL?.replace(/\/+$/, '') ||
      window.location.origin;

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: siteUrl,
          },
        });

        if (error) {
          throw error;
        }

        const user = data?.user;

        if (user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              [
                {
                  id: user.id,
                  full_name: fullName || null,
                },
              ],
              { onConflict: 'id' },
            );

          if (profileError) {
            throw profileError;
          }
        }

        setStatus({
          type: 'success',
          message:
            'Compte créé. Vérifiez vos e-mails si une confirmation est requise, puis connectez-vous.',
        });
        setMode('signin');
        setFullName('');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        setStatus({
          type: 'success',
          message: 'Connexion réussie.',
        });

        if (data?.user) {
          console.log('✅ Authentifié :', data.user.id);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setStatus({
        type: 'error',
        message: err?.message || "Une erreur s'est produite.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl" />
          <div className="absolute bottom-12 -right-24 h-96 w-96 rounded-full bg-purple-500/30 blur-[120px]" />
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wider text-white/70 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Bienvenue sur MY FIRE DEAL
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              Accédez à votre
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                {" "}
                espace de pilotage stratégique
              </span>
            </h1>

            <p className="mt-6 text-lg text-white/70">
              Connectez-vous pour suivre vos deals, monitorer vos filiales et
              piloter vos opérations financières en temps réel. Centralisez vos
              flux et gagnez en impact.
            </p>

            <dl className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <dt className="text-sm uppercase tracking-wider text-white/60">
                  Contrôle
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-white">
                  Vue holding & filiales
                </dd>
                <p className="mt-2 text-sm text-white/60">
                  Consolidez vos activités et suivez les indicateurs clés de
                  votre groupe.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <dt className="text-sm uppercase tracking-wider text-white/60">
                  Financement
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-white">
                  Accès direct NESPIS
                </dd>
                <p className="mt-2 text-sm text-white/60">
                  Activez vos lignes bancaires et suivez les engagements en
                  instantané.
                </p>
              </div>
            </dl>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center bg-slate-950/60 px-6 py-16 sm:px-12 lg:px-16">
          <div className="h-full w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-indigo-900/40 backdrop-blur">
            <div className="flex items-center gap-3 text-indigo-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                {mode === 'signup' ? (
                  <UserPlus className="h-5 w-5" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
              </div>
              <span className="text-sm font-medium uppercase tracking-widest text-white/70">
                {mode === 'signup' ? 'Création de compte' : 'Connexion sécurisée'}
              </span>
            </div>

            <h2 className="mt-6 text-3xl font-semibold text-white">
              {MODES[mode].title}
            </h2>

            {status.message && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                  status.type === "success"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-rose-400/30 bg-rose-400/10 text-rose-200"
                }`}
              >
                {status.message}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {mode === 'signup' && (
                  <label className="block text-sm font-medium text-white/70">
                    Nom complet
                    <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-slate-900/80 px-4">
                      <input
                        type="text"
                        name="full_name"
                        placeholder="Votre nom"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="w-full bg-transparent px-3 py-3 text-white placeholder:text-white/40 focus:outline-none"
                        autoComplete="name"
                      />
                    </div>
                  </label>
                )}
                <label className="block text-sm font-medium text-white/70">
                  Adresse e-mail
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-slate-900/80 px-4">
                    <Mail className="h-5 w-5 text-white/50" />
                    <input
                      type="email"
                      name="email"
                      placeholder="vous@myfiredeal.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-transparent px-3 py-3 text-white placeholder:text-white/40 focus:outline-none"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-white/70">
                  Mot de passe
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-slate-900/80 px-4">
                    <Lock className="h-5 w-5 text-white/50" />
                    <input
                      type="password"
                      name="password"
                      placeholder="********"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full bg-transparent px-3 py-3 text-white placeholder:text-white/40 focus:outline-none"
                      autoComplete="current-password"
                    />
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:shadow-indigo-900/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mode === 'signup' ? (
                  <UserPlus className="h-5 w-5" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                {loading ? 'Patientez...' : MODES[mode].actionLabel}
              </button>

              <p className="text-center text-sm text-white/60">
                {MODES[mode].switchLabel}{' '}
                <button
                  type="button"
                  className="font-medium text-indigo-200 hover:text-indigo-100 underline"
                  onClick={() => {
                    setStatus({ type: '', message: '' });
                    setMode((prevMode) => {
                      const nextMode = prevMode === 'signin' ? 'signup' : 'signin';
                      if (nextMode === 'signin') {
                        setFullName('');
                      }
                      return nextMode;
                    });
                  }}
                >
                  {MODES[mode].switchAction}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
