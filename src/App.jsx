import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import LoginPage from "./components/LoginPage";
import { supabase } from './supabaseClient';

// Menu Profil utilisateur
function ProfileMenu({ user }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.warn('Impossible de charger le profil :', error.message);
          return;
        }

        if (data?.full_name) {
          setFullName(data.full_name);
        }
      } catch (err) {
        console.warn('Erreur profil :', err);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Déconnexion impossible :', err);
    }
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
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Utilisateur</div>
            <div className="text-sm font-medium text-slate-800">
              {fullName || user?.email || 'Utilisateur'}
            </div>
            {fullName && (
              <div className="text-xs text-slate-400">{user?.email}</div>
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
  isPublic: false,
};

const mapProjectToPayload = (project, options = {}) => {
  const payload = {
    nom_du_projet: project.nom || null,
    type_projet: project.typeProjet || null,
    type_secteur: project.type || null,
    partenaire_client: project.partenaire || null,
    statut: project.statut || null,
    objectif: project.objectif || null,
    prochaine_action: project.action || null,
    prompt_marketing: project.promptMarketing || null,
    prompt_partenaire: project.promptPartenaire || null,
    prompt_vendeur: project.promptVendeur || null,
    prompt_specialiste: project.promptSpecialiste || null,
    priorite: project.priorite || null,
    is_public: Boolean(project.isPublic),
  };

  if (options.includeOwnerId) {
    payload.owner_id = options.ownerId ?? null;
  }

  return payload;
};

const mapSupabaseRowToProject = (row) => ({
  id: row?.id ?? '',
  nom: row?.nom_du_projet ?? '',
  type: row?.type_secteur ?? '',
  typeProjet: row?.type_projet ?? 'Filiale',
  partenaire: row?.partenaire_client ?? '',
  statut: row?.statut ?? '',
  objectif: row?.objectif ?? '',
  action: row?.prochaine_action ?? '',
  promptMarketing: row?.prompt_marketing ?? '',
  promptPartenaire: row?.prompt_partenaire ?? '',
  promptVendeur: row?.prompt_vendeur ?? '',
  promptSpecialiste: row?.prompt_specialiste ?? '',
  priorite: row?.priorite ?? 'Moyenne',
  isPublic: Boolean(row?.is_public),
  created_at: row?.created_at ?? new Date().toISOString(),
});

const getProjectTypeLabel = (project) => {
  const typeValue = (project?.type || '').trim();
  if (typeValue) return typeValue;
  const typeProjetValue = (project?.typeProjet || '').trim();
  if (typeProjetValue) return typeProjetValue;
  return 'Type non défini';
};

export default function MyFireDealApp() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Impossible de récupérer la session Supabase :', error);
      }
      setSession(data?.session ?? null);
      setInitializing(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setInitializing(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Chargement...
      </div>
    );
  }

  return session ? <Dashboard session={session} /> : <LoginPage />;
}

function Dashboard({ session }) {
  const user = session?.user;
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Filiale');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState(() => ({ ...INITIAL_PROJECT }));
  const [isSaving, setIsSaving] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [editedProject, setEditedProject] = useState(null);
  const [isProjectEditing, setIsProjectEditing] = useState(false);
  const [isProjectSaving, setIsProjectSaving] = useState(false);
  const [projectModalStatus, setProjectModalStatus] = useState({ type: '', message: '' });

  const fetchProjects = useCallback(async () => {
    if (!supabase || !user) {
      setProjects([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects((data || []).map(mapSupabaseRowToProject));
    } catch (err) {
      console.error('❌ Chargement des projets impossible :', err);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  const handleAddProject = async (event) => {
    event?.preventDefault?.();
    if (isSaving) return;
    if (!supabase || !user) {
      setFormStatus({
        type: 'error',
        message: 'Impossible de créer le projet pour le moment.',
      });
      return;
    }

    setIsSaving(true);
    setFormStatus({ type: '', message: '' });

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          mapProjectToPayload(newProject, {
            includeOwnerId: true,
            ownerId: user.id,
          }),
        ])
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const projectToStore = mapSupabaseRowToProject(data);
        setProjects((prev) => [projectToStore, ...prev.filter((project) => project.id !== projectToStore.id)]);
        setSelectedType(projectToStore.typeProjet || 'Filiale');
      } else {
        await fetchProjects();
      }

      closeCreateModal(newProject.typeProjet);
      setFormStatus({
        type: 'success',
        message: 'Projet enregistré avec succès.',
      });
      console.log('✅ Projet ajouté dans Supabase');
    } catch (err) {
      console.error('❌ Erreur insertion Supabase :', err);
      setFormStatus({
        type: 'error',
        message: "Impossible d'enregistrer le projet.",
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
  const displayedProject =
    isProjectEditing && editedProject ? editedProject : activeProject;
  const projectTabs = [
    { label: 'Filiales', value: 'Filiale' },
    { label: 'Deals', value: 'Deal' },
  ];
  const promptGroups = [
    { title: 'Prompt Marketing', key: 'promptMarketing' },
    { title: 'Prompt Partenaire', key: 'promptPartenaire' },
    { title: 'Prompt Vendeur', key: 'promptVendeur' },
    { title: 'Prompt Spécialiste', key: 'promptSpecialiste' },
  ];

  const openProjectModal = (project) => {
    setActiveProjectId(project.id);
    setEditedProject({ ...project });
    setProjectModalStatus({ type: '', message: '' });
    setIsProjectEditing(false);
    setIsProjectSaving(false);
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setActiveProjectId(null);
    setEditedProject(null);
    setIsProjectEditing(false);
    setIsProjectSaving(false);
    setProjectModalStatus({ type: '', message: '' });
  };

  const startProjectEdit = () => {
    if (!activeProject) return;
    setEditedProject({ ...activeProject });
    setIsProjectEditing(true);
    setProjectModalStatus({ type: '', message: '' });
  };

  const cancelProjectEdit = () => {
    if (activeProject) {
      setEditedProject({ ...activeProject });
    } else {
      setEditedProject(null);
    }
    setIsProjectEditing(false);
    setIsProjectSaving(false);
    setProjectModalStatus({ type: '', message: '' });
  };

  const handleProjectFieldChange = (field, value) => {
    setEditedProject((prev) => (prev ? { ...prev, [field]: value } : prev));
    setProjectModalStatus({ type: '', message: '' });
  };

  const handleSaveProjectChanges = async () => {
    if (!editedProject) return;
    if (!supabase || !user) {
      setProjectModalStatus({
        type: 'error',
        message: 'Impossible de mettre à jour le projet pour le moment.',
      });
      return;
    }

    setIsProjectSaving(true);
    setProjectModalStatus({ type: '', message: '' });

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(mapProjectToPayload(editedProject))
        .eq('id', editedProject.id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const updatedProject = mapSupabaseRowToProject(data);
        setProjects((prev) =>
          prev.map((project) =>
            project.id === updatedProject.id ? updatedProject : project,
          ),
        );
        setEditedProject(updatedProject);
        setSelectedType(updatedProject.typeProjet || 'Filiale');
      } else {
        await fetchProjects();
      }

      setIsProjectEditing(false);
      setProjectModalStatus({
        type: 'success',
        message: 'Projet mis à jour.',
      });
      console.log('✅ Projet mis à jour dans Supabase');
    } catch (err) {
      console.error('❌ Mise à jour du projet impossible :', err);
      setProjectModalStatus({
        type: 'error',
        message: 'Impossible de sauvegarder les modifications.',
      });
    } finally {
      setIsProjectSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              Portefeuille projets
            </h1>
            <p className="text-sm text-slate-500">
              Suivez vos filiales et deals actifs en un coup d&apos;œil.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              {projectTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedType(tab.value)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    selectedType === tab.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              Nouveau projet
            </Button>
            <ProfileMenu user={user} />
          </div>
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {selectedType === 'Filiale' ? 'Filiales actives' : 'Deals actifs'}
            </h2>
            <p className="text-sm text-slate-500">
              {selectedType === 'Filiale'
                ? 'Vue d’ensemble de vos filiales, objectifs et priorités.'
                : 'Suivi des deals en cours et de leur statut.'}
            </p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              <p>
                Aucun projet {selectedType === 'Filiale' ? 'de type Filiale' : 'Deal'} pour le moment.
              </p>
              <p className="mt-2 font-medium text-slate-600">
                Créez-en un via le bouton &laquo; Nouveau projet &raquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const typeLabel = getProjectTypeLabel(project);
                const prompts = promptGroups.map(({ title, key }) => ({
                  title,
                  text: project[key],
                }));
                const details = [
                  { icon: '🤝', label: 'Partenaire', value: project.partenaire || 'À préciser' },
                  { icon: '📌', label: 'Statut', value: project.statut || 'En attente' },
                  { icon: '🎯', label: 'Objectif', value: project.objectif || 'À définir' },
                  { icon: '⚡️', label: 'Action', value: project.action || 'À planifier' },
                  { icon: project.isPublic ? '🌐' : '🔒', label: 'Visibilité', value: project.isPublic ? 'Projet public' : 'Projet privé' },
                ];
                return (
                  <ProjectSummaryCard
                    key={project.id}
                    typeLabel={typeLabel}
                    project={project}
                    details={details}
                    prompts={prompts}
                    onEdit={() => openProjectModal(project)}
                  />
                );
              })}
            </div>
          )}
        </section>

      {showProjectModal && displayedProject && (
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
                    {displayedProject.typeProjet || '—'}
                  </span>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {displayedProject.nom || 'Projet sans titre'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {getProjectTypeLabel(displayedProject)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold uppercase text-slate-600">
                    Priorité&nbsp;: {displayedProject.priorite || 'Moyenne'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    Statut&nbsp;: {displayedProject.statut || 'En attente'}
                  </span>
                  {isProjectEditing ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={cancelProjectEdit}
                        className="border-slate-300 text-slate-600 hover:bg-slate-100"
                        disabled={isProjectSaving}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSaveProjectChanges}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={isProjectSaving}
                      >
                        {isProjectSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={startProjectEdit}
                      className="border-slate-300 text-slate-600 hover:bg-slate-100"
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </div>

              {projectModalStatus.message && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    projectModalStatus.type === 'success'
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600'
                      : projectModalStatus.type === 'error'
                        ? 'border-rose-400/40 bg-rose-400/10 text-rose-600'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {projectModalStatus.message}
                </div>
              )}

              {isProjectEditing ? (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderField(
                      'Nom du projet',
                      editedProject?.nom || '',
                      (e) => handleProjectFieldChange('nom', e.target.value),
                    )}
                    {renderField(
                      'Type / Secteur',
                      editedProject?.type || '',
                      (e) => handleProjectFieldChange('type', e.target.value),
                    )}
                    <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                      Type de projet
                      <select
                        value={editedProject?.typeProjet || 'Filiale'}
                        onChange={(e) =>
                          handleProjectFieldChange('typeProjet', e.target.value)
                        }
                        className="border p-3 rounded-xl w-full mt-2"
                      >
                        <option>Filiale</option>
                        <option>Deal</option>
                      </select>
                    </label>
                    {renderField(
                      'Partenaire / Client',
                      editedProject?.partenaire || '',
                      (e) => handleProjectFieldChange('partenaire', e.target.value),
                    )}
                    {renderField(
                      'Statut',
                      editedProject?.statut || '',
                      (e) => handleProjectFieldChange('statut', e.target.value),
                    )}
                    {renderField(
                      'Objectif',
                      editedProject?.objectif || '',
                      (e) => handleProjectFieldChange('objectif', e.target.value),
                    )}
                    {renderField(
                      'Prochaine action',
                      editedProject?.action || '',
                      (e) => handleProjectFieldChange('action', e.target.value),
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {renderField(
                      'Prompt Marketing',
                      editedProject?.promptMarketing || '',
                      (e) =>
                        handleProjectFieldChange('promptMarketing', e.target.value),
                      'textarea',
                    )}
                    {renderField(
                      'Prompt Partenaire',
                      editedProject?.promptPartenaire || '',
                      (e) =>
                        handleProjectFieldChange('promptPartenaire', e.target.value),
                      'textarea',
                    )}
                    {renderField(
                      'Prompt Vendeur',
                      editedProject?.promptVendeur || '',
                      (e) =>
                        handleProjectFieldChange('promptVendeur', e.target.value),
                      'textarea',
                    )}
                    {renderField(
                      'Prompt Spécialiste',
                      editedProject?.promptSpecialiste || '',
                      (e) =>
                        handleProjectFieldChange('promptSpecialiste', e.target.value),
                      'textarea',
                    )}
                  </div>

                  <label className="block text-sm font-medium text-gray-700 w-full md:w-56">
                    Priorité
                    <select
                      value={editedProject?.priorite || 'Moyenne'}
                      onChange={(e) =>
                        handleProjectFieldChange('priorite', e.target.value)
                      }
                      className="border p-3 rounded-xl w-full mt-2"
                    >
                      <option>Haute</option>
                      <option>Moyenne</option>
                      <option>Basse</option>
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editedProject?.isPublic)}
                      onChange={(e) =>
                        handleProjectFieldChange('isPublic', e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    Projet public
                  </label>
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailRow
                      label="Partenaire / Client"
                      value={displayedProject.partenaire}
                    />
                    <DetailRow label="Objectif" value={displayedProject.objectif} />
                    <DetailRow
                      label="Prochaine action"
                      value={displayedProject.action}
                    />
                    <DetailRow
                      label="Type projet"
                      value={getProjectTypeLabel(displayedProject)}
                    />
                    <DetailRow
                      label="Visibilité"
                      value={displayedProject.isPublic ? 'Projet public' : 'Projet privé'}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <PromptZone
                      title="Prompt Marketing"
                      text={displayedProject.promptMarketing}
                    />
                    <PromptZone
                      title="Prompt Partenaire"
                      text={displayedProject.promptPartenaire}
                    />
                    <PromptZone
                      title="Prompt Vendeur"
                      text={displayedProject.promptVendeur}
                    />
                    <PromptZone
                      title="Prompt Spécialiste"
                      text={displayedProject.promptSpecialiste}
                    />
                  </div>
                </>
              )}
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
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <label className="block font-medium">
                  Priorité
                  <select value={newProject.priorite} onChange={e => setNewProject({ ...newProject, priorite: e.target.value })} className="border p-3 rounded-xl w-40 mt-2">
                    <option>Haute</option>
                    <option>Moyenne</option>
                    <option>Basse</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={newProject.isPublic}
                    onChange={e => setNewProject({ ...newProject, isPublic: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  Projet public
                </label>
              </div>
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

function ProjectSummaryCard({ project, typeLabel, details, prompts, onEdit }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            {typeLabel}
          </div>
          <h3 className="text-xl font-semibold text-blue-900">
            {project.nom || 'Projet sans titre'}
          </h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
            {project.partenaire || 'Partenaire à préciser'}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
            Priorité&nbsp;: {project.priorite || 'Moyenne'}
          </span>
          {project.isPublic ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
              Public
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500">
              Privé
            </span>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          >
            Modifier
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {details.map(({ icon, label, value }) => (
          <InfoChip key={label} icon={icon} label={label} value={value} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {prompts.map(({ title, text }) => (
          <PromptPreview key={title} title={title} text={text} />
        ))}
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="mr-1" aria-hidden="true">
          {icon}
        </span>
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap break-words">
        {value || '—'}
      </p>
    </div>
  );
}

function PromptPreview({ title, text }) {
  return (
    <div className="rounded-xl border border-blue-50 bg-blue-50/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
        {title}
      </p>
      <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap break-words">
        {text || '—'}
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
