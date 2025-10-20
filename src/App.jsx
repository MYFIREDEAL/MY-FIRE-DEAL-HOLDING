import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, X } from "lucide-react";
import LoginPage from "./components/LoginPage";

// Menu Profil utilisateur (démonstration)
function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('password');
  const [editMode, setEditMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const email = 'jack.luc@icloud.com';

  const handleSave = () => {
    if (newPassword) {
      setPassword(newPassword);
      setNewPassword('');
      setEditMode(false);
    }
  };

  const handleLogout = () => {
    window.location.reload(); // démo : reload pour simuler déconnexion
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white/80 border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:bg-slate-100 focus:outline-none"
      >
        <span className="font-medium text-slate-800">Profil</span>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4 space-y-4">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Email</div>
            <div className="text-sm font-medium text-slate-800">{email}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Mot de passe</div>
            {editMode ? (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="border rounded-lg px-2 py-1 text-sm flex-1"
                  placeholder="Nouveau mot de passe"
                />
                <button onClick={handleSave} className="text-green-700 font-semibold text-xs">Enregistrer</button>
                <button onClick={() => setEditMode(false)} className="text-slate-400 text-xs">Annuler</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{password}</span>
                <button onClick={() => setEditMode(true)} className="text-indigo-600 text-xs font-medium hover:underline">Modifier</button>
              </div>
            )}
          </div>
          <div>
            <button onClick={handleLogout} className="w-full text-center text-sm text-rose-600 font-semibold py-2 rounded-lg hover:bg-rose-50">Se déconnecter</button>
          </div>
        </div>
      )}
    </div>
  );
}

const INITIAL_PROJECT = {
  nom: '',
  type: '',
  typeProjet: 'Filiale',
  partenaire: '',
  statut: '',
  objectif: '',
  action: '',
  promptMarketing: '',
  promptPartenaire: '',
  promptVendeur: '',
  promptSpecialiste: '',
  priorite: 'Moyenne',
};

const LOCAL_PROJECTS_KEY = 'myfiredeal.projects';

const generateProjectId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const loadProjects = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((project) => ({
      ...INITIAL_PROJECT,
      ...project,
      id: project.id ?? generateProjectId(),
    }));
  } catch (err) {
    console.warn('Impossible de charger les projets locaux :', err);
    return [];
  }
};

const saveProjects = (projects) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn('Impossible de sauvegarder les projets locaux :', err);
    throw err;
  }
};

const getProjectTypeLabel = (project) => {
  const typeValue = (project?.type || '').trim();
  if (typeValue) return typeValue;
  const typeProjetValue = (project?.typeProjet || '').trim();
  if (typeProjetValue) return typeProjetValue;
  return 'Type non défini';
};

export default function MyFireDealApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return isLoggedIn ? <Dashboard /> : <LoginPage onSuccess={() => setIsLoggedIn(true)} />;
}

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Filiale');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState(() => ({ ...INITIAL_PROJECT }));
  const [isSaving, setIsSaving] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const resetProjectForm = (typeProjet = selectedType) => {
    setNewProject(() => ({ ...INITIAL_PROJECT, typeProjet }));
  };

  const openCreateModal = () => {
    setFormStatus({ type: '', message: '' });
    resetProjectForm(selectedType);
    setShowModal(true);
  };

  const closeCreateModal = (typeProjet = selectedType) => {
    setShowModal(false);
    setFormStatus({ type: '', message: '' });
    resetProjectForm(typeProjet);
  };

  const handleAddProject = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setFormStatus({ type: '', message: '' });

    const projectToSave = {
      id: generateProjectId(),
      nom: newProject.nom,
      type: newProject.type,
      typeProjet: newProject.typeProjet,
      partenaire: newProject.partenaire,
      statut: newProject.statut,
      objectif: newProject.objectif,
      action: newProject.action,
      promptMarketing: newProject.promptMarketing,
      promptPartenaire: newProject.promptPartenaire,
      promptVendeur: newProject.promptVendeur,
      promptSpecialiste: newProject.promptSpecialiste,
      priorite: newProject.priorite,
      created_at: new Date().toISOString(),
    };

    try {
      setProjects((prev) => {
        const updated = [projectToSave, ...prev];
        saveProjects(updated);
        return updated;
      });
      setSelectedType(projectToSave.typeProjet || 'Filiale');
      closeCreateModal(projectToSave.typeProjet);
    } catch (err) {
      console.error('❌ Enregistrement local impossible :', err);
      setFormStatus({
        type: 'error',
        message: 'Impossible d’enregistrer le projet localement.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const renderField = (label, value, onChange, type = 'text') => (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {type === 'textarea' ? (
        <textarea value={value} onChange={onChange} className="border p-3 rounded-xl w-full mt-2" />
      ) : (
        <input value={value} onChange={onChange} className="border p-3 rounded-xl w-full mt-2" />
      )}
    </label>
  );

  const filteredProjects = projects.filter(
    (project) => project.typeProjet === selectedType
  );
  const activeProject = projects.find((project) => project.id === activeProjectId);

  const openProjectModal = (project) => {
    setActiveProjectId(project.id);
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setActiveProjectId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-gray-900 p-8 relative">
      <div className="flex justify-end items-center gap-6 mb-8">
        <ProfileMenu />
        <Button onClick={openCreateModal} className="flex items-center gap-2 bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-teal-800">
          <PlusCircle className="h-5 w-5" /> Ajouter un projet
        </Button>
      </div>




      <div className="mb-10 grid gap-6 md:grid-cols-2">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => setSelectedType('Filiale')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedType('Filiale');
              }
          }}
          className={`border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-400/10 shadow-xl shadow-indigo-900/10 transition ${
            selectedType === 'Filiale'
              ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-white'
              : 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl'
          }`}
        >
          <CardContent className="p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">Holding</span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900">MY FIRE DEAL</h2>
            <p className="mt-4 text-base text-slate-600">
              Pilotez vos filiales, vos assets stratégiques et vos indicateurs clés depuis un cockpit consolidé.
            </p>
          </CardContent>
        </Card>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => setSelectedType('Deal')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedType('Deal');
              }
          }}
          className={`border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-400/10 shadow-xl shadow-emerald-900/10 transition ${
            selectedType === 'Deal'
              ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white'
              : 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl'
          }`}
        >
          <CardContent className="p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">Transaction</span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900">DEAL</h2>
            <p className="mt-4 text-base text-slate-600">
              Cadrez, exécutez et sécurisez chaque deal avec des workflows intelligents et une collaboration fluide.
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {selectedType === 'Filiale' ? 'Filiales actives' : 'Deals actifs'}
          </h2>
          <p className="text-sm text-slate-500">
            {selectedType === 'Filiale'
              ? 'Visualisez vos structures opérationnelles et leurs priorités.'
              : 'Suivez vos opérations transactionnelles et leurs statuts.'}
          </p>
        </div>

        {filteredProjects.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/40 p-6 text-center text-slate-500">
            <p className="text-sm">
              Aucun projet {selectedType === 'Filiale' ? 'de type Filiale' : 'Deal'} pour le moment.
            </p>
            <p className="text-sm">
              Créez-en un via le bouton <span className="font-semibold">Ajouter un projet</span>.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => openProjectModal(project)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openProjectModal(project);
                  }
                }}
                className="cursor-pointer border-slate-200 bg-white/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {project.nom || 'Sans titre'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {getProjectTypeLabel(project)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                      {project.priorite}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="font-medium text-slate-600">
                      {project.partenaire || 'Partenaire non défini'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {project.statut || 'Statut en attente'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {project.objectif || 'Objectif à définir'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {showProjectModal && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <button
              className="absolute right-6 top-6 text-slate-500 transition hover:text-slate-700"
              onClick={closeProjectModal}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="space-y-8 p-8 md:p-12 overflow-y-auto max-h-[85vh]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    {activeProject.typeProjet}
                  </span>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {activeProject.nom || 'Projet sans titre'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {activeProject.type || 'Type non défini'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold uppercase text-slate-600">
                    Priorité&nbsp;: {activeProject.priorite}
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    Statut&nbsp;: {activeProject.statut || 'En attente'}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="Partenaire / Client" value={activeProject.partenaire} />
                <DetailRow label="Objectif" value={activeProject.objectif} />
                <DetailRow label="Prochaine action" value={activeProject.action} />
                <DetailRow label="Type projet" value={getProjectTypeLabel(activeProject)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PromptZone title="Prompt Marketing" text={activeProject.promptMarketing} />
                <PromptZone title="Prompt Partenaire" text={activeProject.promptPartenaire} />
                <PromptZone title="Prompt Vendeur" text={activeProject.promptVendeur} />
                <PromptZone title="Prompt Spécialiste" text={activeProject.promptSpecialiste} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-xl p-8 relative">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={() => closeCreateModal(newProject.typeProjet)}>
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Créer un nouveau projet</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {renderField('Nom du projet', newProject.nom, e => setNewProject({ ...newProject, nom: e.target.value }))}
              {renderField('Type / Secteur', newProject.type, e => setNewProject({ ...newProject, type: e.target.value }))}
              <label className="block text-sm font-medium text-gray-700 col-span-2">
                Type de projet
                <select value={newProject.typeProjet} onChange={e => setNewProject({ ...newProject, typeProjet: e.target.value })} className="border p-3 rounded-xl w-full mt-2">
                  <option>Filiale</option>
                  <option>Deal</option>
                </select>
              </label>
              {renderField('Partenaire / Client', newProject.partenaire, e => setNewProject({ ...newProject, partenaire: e.target.value }))}
              {renderField('Statut', newProject.statut, e => setNewProject({ ...newProject, statut: e.target.value }))}
              {renderField('Objectif', newProject.objectif, e => setNewProject({ ...newProject, objectif: e.target.value }))}
              {renderField('Prochaine action', newProject.action, e => setNewProject({ ...newProject, action: e.target.value }))}
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {renderField('Prompt Marketing', newProject.promptMarketing, e => setNewProject({ ...newProject, promptMarketing: e.target.value }), 'textarea')}
              {renderField('Prompt Partenaire', newProject.promptPartenaire, e => setNewProject({ ...newProject, promptPartenaire: e.target.value }), 'textarea')}
              {renderField('Prompt Vendeur', newProject.promptVendeur, e => setNewProject({ ...newProject, promptVendeur: e.target.value }), 'textarea')}
              {renderField('Prompt Spécialiste', newProject.promptSpecialiste, e => setNewProject({ ...newProject, promptSpecialiste: e.target.value }), 'textarea')}
            </div>

            {formStatus.message && (
              <div
                className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                  formStatus.type === 'success'
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600'
                    : formStatus.type === 'warning'
                      ? 'border-amber-400/40 bg-amber-300/10 text-amber-600'
                      : 'border-rose-400/40 bg-rose-400/10 text-rose-600'
                }`}
              >
                {formStatus.message}
              </div>
            )}

            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Priorité

                <select value={newProject.priorite} onChange={e => setNewProject({ ...newProject, priorite: e.target.value })} className="border p-3 rounded-xl w-40 mt-2">
                  <option>Haute</option>
                  <option>Moyenne</option>
                  <option>Basse</option>
                </select>
              </label>
              <div className="flex gap-4">
                <Button variant='outline' onClick={() => closeCreateModal(newProject.typeProjet)} className='border-gray-300 text-gray-700 hover:bg-gray-100'>Annuler</Button>
                <Button
                  onClick={handleAddProject}
                  className='bg-green-500 hover:bg-green-600 text-white'
                  disabled={isSaving}
                >
                  {isSaving ? 'Enregistrement...' : 'Valider'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-700">
        {value || '—'}
      </p>
    </div>
  );
}

function PromptZone({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
        {title}
      </span>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
        {text || '—'}
      </p>
    </div>
  );
}
