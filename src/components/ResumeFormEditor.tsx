import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, Experience, Education, SkillCategory, Certification, Project, CustomSection, CustomSectionItem } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, User, Briefcase, GraduationCap, Code, FolderGit2, Award, Settings, CheckCircle } from 'lucide-react';

interface ResumeFormEditorProps {
  data: ResumeData;
  onChange: (newData: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
}

export default function ResumeFormEditor({ data, onChange }: ResumeFormEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Flash a "Section added!" toast
  const flashAdded = (label: string) => {
    setJustAdded(label);
    setTimeout(() => setJustAdded(null), 1500);
  };

  const updatePersonal = (field: keyof ResumeData['personalDetails'], value: string) => {
    onChange(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [field]: value
      }
    }));
  };

  // Generic helper to update a list item field
  const updateListItem = <T extends any>(
    section: 'experience' | 'education' | 'projects' | 'certifications',
    index: number,
    field: string,
    value: any
  ) => {
    onChange(prev => {
      const list = [...(prev[section] || [])] as any[];
      if (list[index]) {
        list[index] = { ...list[index], [field]: value };
      }
      return { ...prev, [section]: list };
    });
  };

  const addListItem = (section: 'experience' | 'education' | 'projects' | 'certifications') => {
    onChange(prev => {
      const list = [...(prev[section] || [])] as any[];
      let newItem: any;
      if (section === 'experience') {
        newItem = { company: '', role: '', duration: '', location: '', responsibilities: [''] };
      } else if (section === 'education') {
        newItem = { institution: '', degree: '', duration: '', location: '', details: '' };
      } else if (section === 'projects') {
        newItem = { name: '', role: '', duration: '', description: '', url: '' };
      } else if (section === 'certifications') {
        newItem = { name: '', issuer: '', date: '' };
      }
      return { ...prev, [section]: [...list, newItem] };
    });
    const labels: Record<string, string> = { experience: 'Job', education: 'School', projects: 'Project', certifications: 'Certification' };
    flashAdded(labels[section] + ' added!');
  };

  const removeListItem = (section: 'experience' | 'education' | 'projects' | 'certifications', index: number) => {
    onChange(prev => {
      const list = [...(prev[section] || [])];
      list.splice(index, 1);
      return { ...prev, [section]: list };
    });
  };

  // Experience responsibilities helpers
  const updateResponsibility = (expIndex: number, respIndex: number, value: string) => {
    onChange(prev => {
      const experience = [...prev.experience];
      if (experience[expIndex]) {
        const resps = [...experience[expIndex].responsibilities];
        resps[respIndex] = value;
        experience[expIndex] = { ...experience[expIndex], responsibilities: resps };
      }
      return { ...prev, experience };
    });
  };

  const addResponsibility = (expIndex: number) => {
    onChange(prev => {
      const experience = [...prev.experience];
      if (experience[expIndex]) {
        experience[expIndex] = {
          ...experience[expIndex],
          responsibilities: [...experience[expIndex].responsibilities, '']
        };
      }
      return { ...prev, experience };
    });
  };

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    onChange(prev => {
      const experience = [...prev.experience];
      if (experience[expIndex]) {
        const resps = [...experience[expIndex].responsibilities];
        resps.splice(respIndex, 1);
        experience[expIndex] = { ...experience[expIndex], responsibilities: resps };
      }
      return { ...prev, experience };
    });
  };

  // Skills helpers
  const updateSkillCategory = (index: number, value: string) => {
    onChange(prev => {
      const skills = [...prev.skills];
      if (skills[index]) {
        skills[index] = { ...skills[index], category: value };
      }
      return { ...prev, skills };
    });
  };

  const updateSkillItems = (index: number, value: string) => {
    const items = value.split(',').map(s => s.trim());
    onChange(prev => {
      const skills = [...prev.skills];
      if (skills[index]) {
        skills[index] = { ...skills[index], items };
      }
      return { ...prev, skills };
    });
  };

  const addSkillCategory = () => {
    onChange(prev => ({
      ...prev,
      skills: [...prev.skills, { category: '', items: [] }]
    }));
    flashAdded('Category added!');
  };

  const removeSkillCategory = (index: number) => {
    onChange(prev => {
      const skills = [...prev.skills];
      skills.splice(index, 1);
      return { ...prev, skills };
    });
  };

  // Custom sections helpers
  const addCustomSection = () => {
    const id = 'custom_' + Date.now().toString(36);
    onChange(prev => ({
      ...prev,
      customSections: [
        ...(prev.customSections || []),
        { id, title: 'New Section', items: [{ title: '', subtitle: '', date: '', description: '' }] }
      ]
    }));
    flashAdded('Section added!');
  };

  const updateCustomSectionTitle = (id: string, value: string) => {
    onChange(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(cs =>
        cs.id === id ? { ...cs, title: value } : cs
      )
    }));
  };

  const removeCustomSection = (id: string) => {
    onChange(prev => ({
      ...prev,
      customSections: (prev.customSections || []).filter(cs => cs.id !== id)
    }));
  };

  const addCustomSectionItem = (sectionId: string) => {
    onChange(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(cs =>
        cs.id === sectionId ? { ...cs, items: [...cs.items, { title: '', subtitle: '', date: '', description: '' }] } : cs
      )
    }));
  };

  const updateCustomSectionItemField = (sectionId: string, itemIndex: number, field: keyof CustomSectionItem, value: string) => {
    onChange(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(cs => {
        if (cs.id === sectionId) {
          const items = [...cs.items];
          items[itemIndex] = { ...items[itemIndex], [field]: value };
          return { ...cs, items };
        }
        return cs;
      })
    }));
  };

  const removeCustomSectionItem = (sectionId: string, itemIndex: number) => {
    onChange(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(cs => {
        if (cs.id === sectionId) {
          const items = [...cs.items];
          items.splice(itemIndex, 1);
          return { ...cs, items };
        }
        return cs;
      })
    }));
  };

  const menuItems = [
    { id: 'personal', name: 'Personal Details', icon: User },
    { id: 'experience', name: 'Work Experience', icon: Briefcase },
    { id: 'skills', name: 'Skills & Expertise', icon: Code },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'projects', name: 'Projects', icon: FolderGit2 },
    { id: 'certifications', name: 'Certifications', icon: Award },
    { id: 'custom', name: 'Custom Sections', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row h-full glass-card overflow-hidden relative">
      {/* "Section added!" toast */}
      {justAdded && (
        <div className="absolute top-3 right-3 z-50 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm animate-slideDown">
          <CheckCircle className="w-3.5 h-3.5" />
          {justAdded}
        </div>
      )}

      {/* Tab Menu */}
      <div className="w-full md:w-48 bg-white/[0.03] border-r border-white/[0.06] flex md:flex-col shrink-0 overflow-x-auto md:overflow-y-auto scroll-hide">
        {menuItems.map(item => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider text-left border-b md:border-b-0 md:border-l-2 transition-all shrink-0 form-section-header ${
                active
                  ? 'bg-[var(--accent-primary)]/10 border-indigo-400 text-indigo-300 md:border-l-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[60vh] md:max-h-[75vh]">
        {activeSection === 'personal' && (
          <div className="space-y-4 section-panel">
            <h3 className="text-sm font-bold text-slate-200 border-b border-white/10 pb-2 mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={data.personalDetails.name}
                  onChange={e => updatePersonal('name', e.target.value)}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm"
                  placeholder="Alex Rivera"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  value={data.personalDetails.title}
                  onChange={e => updatePersonal('title', e.target.value)}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm"
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={data.personalDetails.email}
                  onChange={e => updatePersonal('email', e.target.value)}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm"
                  placeholder="alex@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={data.personalDetails.phone}
                  onChange={e => updatePersonal('phone', e.target.value)}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm"
                  placeholder="+1 555 0123"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location</label>
                <input
                  type="text"
                  value={data.personalDetails.location}
                  onChange={e => updatePersonal('location', e.target.value)}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm"
                  placeholder="New York, NY"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={data.personalDetails.linkedin}
                  onChange={e => updatePersonal('linkedin', e.target.value)}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm"
                  placeholder="linkedin.com/in/alexrivera"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Personal Website</label>
                <input
                  type="text"
                  value={data.personalDetails.website || ''}
                  onChange={e => updatePersonal('website', e.target.value)}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm"
                  placeholder="alexrivera.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Professional Summary</label>
                <textarea
                  value={data.personalDetails.summary}
                  onChange={e => updatePersonal('summary', e.target.value)}
                  rows={4}
                  className="w-full tech-input rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Write a brief professional summary..."
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="space-y-4 section-panel">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-slate-200">Work Experience</h3>
              <button
                onClick={() => addListItem('experience')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Job
              </button>
            </div>

            {(data.experience || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No experience items added yet.</p>
            ) : (
              <div className="space-y-4">
                {(data.experience || []).map((exp, idx) => (
                  <div key={idx} className="rounded-xl p-4 bg-transparent relative form-card-item">
                    <button
                      onClick={() => removeListItem('experience', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8" style={{ gap: '16px' }}>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={e => updateListItem('experience', idx, 'company', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role / Job Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={e => updateListItem('experience', idx, 'role', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Senior Developer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration / Dates</label>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={e => updateListItem('experience', idx, 'duration', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Jan 2022 — Present"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={e => updateListItem('experience', idx, 'location', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Remote / New York"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <div className="flex justify-between items-center mt-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Key Responsibilities / Achievements</label>
                          <button
                            onClick={() => addResponsibility(idx)}
                            className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                          >
                            <Plus className="w-3 h-3" /> Add Achievement
                          </button>
                        </div>
                        {(exp.responsibilities || []).map((resp, respIdx) => (
                          <div key={respIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={resp}
                              onChange={e => updateResponsibility(idx, respIdx, e.target.value)}
                              className="flex-1 rounded-lg px-3 py-1.5 text-sm tech-input"
                              placeholder="Led a team of..."
                            />
                            <button
                              onClick={() => removeResponsibility(idx, respIdx)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-4 section-panel">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-slate-200">Skills & Expertise</h3>
              <button
                onClick={addSkillCategory}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>

            {(data.skills || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No skill categories added yet.</p>
            ) : (
              <div className="space-y-4">
                {(data.skills || []).map((skillGroup, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 rounded-xl p-4 bg-transparent relative form-card-item">
                    <button
                      onClick={() => removeSkillCategory(idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition md:relative md:top-auto md:right-auto md:self-end md:mb-1 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:mr-4">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category Title</label>
                        <input
                          type="text"
                          value={skillGroup.category}
                          onChange={e => updateSkillCategory(idx, e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="e.g. Design Tools"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Skills (comma separated)</label>
                        <input
                          type="text"
                          value={(skillGroup.items || []).join(', ')}
                          onChange={e => updateSkillItems(idx, e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Figma, Adobe CC, Sketch"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block">Separate multiple items with commas.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'education' && (
          <div className="space-y-4 section-panel">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-slate-200">Education</h3>
              <button
                onClick={() => addListItem('education')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add School
              </button>
            </div>

            {(data.education || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No education items added yet.</p>
            ) : (
              <div className="space-y-4">
                {(data.education || []).map((edu, idx) => (
                  <div key={idx} className="rounded-xl p-4 bg-transparent relative form-card-item">
                    <button
                      onClick={() => removeListItem('education', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={e => updateListItem('education', idx, 'institution', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Harvard University"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Degree / Course</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={e => updateListItem('education', idx, 'degree', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="B.S. in Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration / Dates</label>
                        <input
                          type="text"
                          value={edu.duration}
                          onChange={e => updateListItem('education', idx, 'duration', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="2018 — 2022"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={e => updateListItem('education', idx, 'location', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Cambridge, MA"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Details (e.g. GPA, Honors)</label>
                        <input
                          type="text"
                          value={edu.details}
                          onChange={e => updateListItem('education', idx, 'details', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="GPA 3.9, Honors Program"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="space-y-4 section-panel">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-slate-200">Projects</h3>
              <button
                onClick={() => addListItem('projects')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {(data.projects || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No projects added yet.</p>
            ) : (
              <div className="space-y-4">
                {(data.projects || []).map((proj, idx) => (
                  <div key={idx} className="rounded-xl p-4 bg-transparent relative form-card-item">
                    <button
                      onClick={() => removeListItem('projects', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Name</label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={e => updateListItem('projects', idx, 'name', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="AI Tool Dashboard"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role / Tech Stack</label>
                        <input
                          type="text"
                          value={proj.role}
                          onChange={e => updateListItem('projects', idx, 'role', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Lead Frontend Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration / Dates</label>
                        <input
                          type="text"
                          value={proj.duration}
                          onChange={e => updateListItem('projects', idx, 'duration', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="2024"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project URL (Optional)</label>
                        <input
                          type="text"
                          value={proj.url || ''}
                          onChange={e => updateListItem('projects', idx, 'url', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                        <textarea
                          value={proj.description}
                          onChange={e => updateListItem('projects', idx, 'description', e.target.value)}
                          rows={3}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input resize-none"
                          placeholder="Designed and built a web app that..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'certifications' && (
          <div className="space-y-4 section-panel">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-slate-200">Certifications</h3>
              <button
                onClick={() => addListItem('certifications')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>

            {(data.certifications || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No certifications added yet.</p>
            ) : (
              <div className="space-y-4">
                {(data.certifications || []).map((cert, idx) => (
                  <div key={idx} className="rounded-xl p-4 bg-transparent relative form-card-item">
                    <button
                      onClick={() => removeListItem('certifications', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-8">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Certification Name</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={e => updateListItem('certifications', idx, 'name', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="AWS Solutions Architect"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Issuer</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={e => updateListItem('certifications', idx, 'issuer', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="Amazon Web Services"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                        <input
                          type="text"
                          value={cert.date}
                          onChange={e => updateListItem('certifications', idx, 'date', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm tech-input"
                          placeholder="2023"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'custom' && (
          <div className="space-y-4 section-panel">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-slate-200">Custom Sections</h3>
              <button
                onClick={addCustomSection}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            {(data.customSections || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No custom sections added yet.</p>
            ) : (
              <div className="space-y-4">
                {(data.customSections || []).map((cs, idx) => (
                  <div key={cs.id} className="rounded-xl p-4 bg-transparent relative form-card-item">
                    <button
                      onClick={() => removeCustomSection(cs.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-4">
                      <div className="max-w-xs mr-8">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Section Title</label>
                        <input
                          type="text"
                          value={cs.title}
                          onChange={e => updateCustomSectionTitle(cs.id, e.target.value)}
                          className="w-full tech-input rounded-lg px-3 py-1.5 text-sm font-bold"
                          placeholder="Languages / Awards"
                        />
                      </div>

                      <div className="border-t border-slate-200/60 pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Section Items</p>
                          <button
                            onClick={() => addCustomSectionItem(cs.id)}
                            className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                          >
                            <Plus className="w-3 h-3" /> Add Item
                          </button>
                        </div>

                        {(cs.items || []).map((item, itemIdx) => (
                          <div key={itemIdx} className="border border-slate-100 rounded-lg p-3 tech-input relative">
                            <button
                              onClick={() => removeCustomSectionItem(cs.id, itemIdx)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mr-6">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Title</label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={e => updateCustomSectionItemField(cs.id, itemIdx, 'title', e.target.value)}
                                  className="w-full rounded-md px-2 py-1 text-xs bg-transparent/50"
                                  placeholder="Item Title"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Subtitle (Optional)</label>
                                <input
                                  type="text"
                                  value={item.subtitle || ''}
                                  onChange={e => updateCustomSectionItemField(cs.id, itemIdx, 'subtitle', e.target.value)}
                                  className="w-full rounded-md px-2 py-1 text-xs bg-transparent/50"
                                  placeholder="Sub description"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Date (Optional)</label>
                                <input
                                  type="text"
                                  value={item.date || ''}
                                  onChange={e => updateCustomSectionItemField(cs.id, itemIdx, 'date', e.target.value)}
                                  className="w-full rounded-md px-2 py-1 text-xs bg-transparent/50"
                                  placeholder="2023"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Description (Optional)</label>
                                <textarea
                                  value={item.description || ''}
                                  onChange={e => updateCustomSectionItemField(cs.id, itemIdx, 'description', e.target.value)}
                                  rows={2}
                                  className="w-full rounded-md px-2 py-1 text-xs bg-transparent/50 resize-none"
                                  placeholder="Describe the item..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
