import React from 'react';
import { ResumeData, TemplateId } from '../types';
import { Mail, Phone, MapPin, Linkedin, Link as LinkIcon, Briefcase, GraduationCap, Code, LayoutTemplate } from 'lucide-react';


interface TemplateProps {
  data: ResumeData;
  showProfilePicture: boolean;
  sectionOrder?: string[];
  fontFamily?: string;
  aestheticTheme?: 'default' | 'ocean' | 'sunset' | 'forest';
  pageBreaks?: Record<string, boolean>;
  pageIndex?: number;
}

const defaultOrder = ['summary', 'experience', 'skills', 'education', 'projects'];

const aestheticThemesData = {
  default: {
    bg: 'bg-[#fbf9f6]',
    shape1: 'bg-pink-100',
    shape2: 'bg-yellow-100',
    textMainHighlight: 'text-pink-600',
    icon1Bg: 'bg-pink-100', icon1Text: 'text-pink-600',
    icon2Bg: 'bg-yellow-100', icon2Text: 'text-yellow-600',
    icon3Bg: 'bg-blue-100', icon3Text: 'text-blue-600',
    icon4Bg: 'bg-purple-100', icon4Text: 'text-purple-600',
    bulletPill: 'marker:text-pink-400',
    accentLine: 'bg-pink-500',
    projRole: 'text-purple-500',
    eduDot: 'bg-yellow-400',
    sel: 'selection:bg-pink-200'
  },
  ocean: {
    bg: 'bg-slate-50',
    shape1: 'bg-sky-100',
    shape2: 'bg-teal-100',
    textMainHighlight: 'text-sky-600',
    icon1Bg: 'bg-sky-100', icon1Text: 'text-sky-600',
    icon2Bg: 'bg-teal-100', icon2Text: 'text-teal-600',
    icon3Bg: 'bg-blue-100', icon3Text: 'text-blue-600',
    icon4Bg: 'bg-cyan-100', icon4Text: 'text-cyan-600',
    bulletPill: 'marker:text-sky-400',
    accentLine: 'bg-sky-500',
    projRole: 'text-cyan-600',
    eduDot: 'bg-teal-400',
    sel: 'selection:bg-sky-200'
  },
  sunset: {
    bg: 'bg-orange-50',
    shape1: 'bg-orange-100',
    shape2: 'bg-red-100',
    textMainHighlight: 'text-orange-600',
    icon1Bg: 'bg-orange-100', icon1Text: 'text-orange-600',
    icon2Bg: 'bg-red-100', icon2Text: 'text-red-600',
    icon3Bg: 'bg-amber-100', icon3Text: 'text-amber-600',
    icon4Bg: 'bg-rose-100', icon4Text: 'text-rose-600',
    bulletPill: 'marker:text-orange-400',
    accentLine: 'bg-orange-500',
    projRole: 'text-rose-500',
    eduDot: 'bg-red-400',
    sel: 'selection:bg-orange-200'
  },
  forest: {
    bg: 'bg-green-50',
    shape1: 'bg-emerald-100',
    shape2: 'bg-lime-100',
    textMainHighlight: 'text-emerald-600',
    icon1Bg: 'bg-emerald-100', icon1Text: 'text-emerald-600',
    icon2Bg: 'bg-lime-100', icon2Text: 'text-lime-600',
    icon3Bg: 'bg-green-100', icon3Text: 'text-green-600',
    icon4Bg: 'bg-teal-100', icon4Text: 'text-teal-600',
    bulletPill: 'marker:text-emerald-400',
    accentLine: 'bg-emerald-500',
    projRole: 'text-green-600',
    eduDot: 'bg-lime-400',
    sel: 'selection:bg-emerald-200'
  }
};


export const ClassicTemplate: React.FC<TemplateProps> = ({ data, showProfilePicture, sectionOrder, fontFamily, pageBreaks, pageIndex }) => {
  const { personalDetails, experience, education, skills, projects, certifications, customSections } = data;

  const renderSection = (sectionId: string) => {
     let content = null;
     switch (sectionId) {
        case 'summary':
          if(personalDetails.summary) content = (
            <section className="mb-6">
              <p className="text-sm leading-relaxed">{personalDetails.summary}</p>
            </section>
          );
          break;
        case 'experience':
          if(experience.length > 0) content = (
            <section className="mb-6">
              <h2 className="text-base font-bold uppercase border-b border-gray-300 mb-4 tracking-widest">Professional Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-md font-bold">{exp.company}</h3>
                    <span className="text-sm italic">{exp.location}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm font-semibold italic">{exp.role}</p>
                    <span className="text-sm">{exp.duration}</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 text-[13px] space-y-1">
                    {exp.responsibilities.filter(r => r.trim()).map((resp, j) => (
                      <li key={j}>{resp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          );
          break;
        case 'skills':
          if(skills.length > 0) content = (
            <section className="mb-6">
               <h2 className="text-base font-bold uppercase border-b border-gray-300 mb-4 tracking-widest">Skills & Expertise</h2>
               <div className="text-[13px] leading-relaxed">
                 {skills.map((skillGroup, i) => (
                   <div key={i} className="mb-1">
                     {skillGroup.category && <span className="font-bold">{skillGroup.category}: </span>}
                     <span>{skillGroup.items.filter(s => s.trim()).join(', ')}</span>
                   </div>
                 ))}
               </div>
            </section>
          );
          break;
        case 'education':
          if(education.length > 0) content = (
            <section className="mb-6">
               <h2 className="text-base font-bold uppercase border-b border-gray-300 mb-4 tracking-widest">Education</h2>
               {education.map((edu, i) => (
                 <div key={i} className="mb-3">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-[15px] font-bold">{edu.institution}</h3>
                      <span className="text-sm">{edu.location}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm italic">{edu.degree}</p>
                      <span className="text-sm">{edu.duration}</span>
                    </div>
                    {edu.details && <p className="text-sm mt-1">{edu.details}</p>}
                 </div>
               ))}
            </section>
          );
          break;
        case 'projects':
          if (projects && projects.length > 0) content = (
            <section className="mb-6">
               <h2 className="text-base font-bold uppercase border-b border-gray-300 mb-4 tracking-widest">Selected Projects</h2>
               {projects.map((proj, i) => (
                 <div key={i} className="mb-3">
                   <div className="flex justify-between items-baseline">
                     <h3 className="text-[15px] font-bold truncate">{proj.name}</h3>
                     <span className="text-sm">{proj.duration}</span>
                   </div>
                   <p className="text-[13px] font-semibold italic mb-1">{proj.role}</p>
                   {proj.description && <p className="text-[13px]">{proj.description}</p>}
                 </div>
               ))}
            </section>
          );
          break;
        case 'certifications':
          if (certifications && certifications.length > 0) content = (
            <section className="mb-6">
               <h2 className="text-base font-bold uppercase border-b border-gray-300 mb-4 tracking-widest">Certifications</h2>
               {certifications.map((cert, i) => (
                 <div key={i} className="mb-3">
                   <div className="flex justify-between items-baseline">
                     <h3 className="text-md font-bold">{cert.name}</h3>
                     <span className="text-sm">{cert.date}</span>
                   </div>
                   <p className="text-sm text-gray-700">{cert.issuer}</p>
                 </div>
               ))}
            </section>
          );
          break;
        default:
          const customSec = customSections?.find(c => c.id === sectionId);
          if (customSec && customSec.items.length > 0) content = (
            <section className="mb-6">
               <h2 className="text-base font-bold uppercase border-b border-gray-300 mb-4 tracking-widest">{customSec.title}</h2>
               {customSec.items.map((item, i) => (
                 <div key={i} className="mb-3">
                   <div className="flex justify-between items-baseline">
                     <h3 className="text-md font-bold">{item.title}</h3>
                     {item.date && <span className="text-sm">{item.date}</span>}
                   </div>
                   {item.subtitle && <p className="text-sm font-semibold italic mb-1">{item.subtitle}</p>}
                   {item.description && <p className="text-sm">{item.description}</p>}
                 </div>
               ))}
            </section>
          );
          break;
     }

     if (content) {
         return (
             <React.Fragment key={sectionId}>
                {content}
                {pageBreaks?.[sectionId] && <div className="break-after-page clear-both w-full" style={{ pageBreakAfter: 'always', width: '100%' }}></div>}
             </React.Fragment>
         );
     }
     return null;
  };

  return (
    <div className={`${fontFamily || 'font-serif'} text-gray-900 bg-white p-8 md:p-12 shadow-sm min-h-[1056px] w-[816px] box-border relative transition-all duration-200`}>
      {(!pageIndex || pageIndex === 0) && (
      <div className="border-b-2 border-gray-900 pb-4 mb-6 flex items-start gap-6">
        {showProfilePicture && personalDetails.profilePictureUrl && (
          <img src={personalDetails.profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border border-gray-300" />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2 truncate">{personalDetails.name}</h1>
          <p className="text-lg text-gray-700 italic mb-2">{personalDetails.title}</p>
          <div className="text-sm flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
            {personalDetails.email && <span>{personalDetails.email}</span>}
            {personalDetails.phone && <span>{personalDetails.phone}</span>}
            {personalDetails.location && <span>{personalDetails.location}</span>}
            {personalDetails.linkedin && <span>{personalDetails.linkedin}</span>}
          </div>
        </div>
      </div>
      )}

      {(sectionOrder || defaultOrder).map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export const ModernTemplate: React.FC<TemplateProps> = ({ data, showProfilePicture, sectionOrder, fontFamily, pageBreaks, pageIndex }) => {
  const { personalDetails, experience, education, skills, projects, certifications, customSections } = data;

  const renderRightColumnSection = (sectionId: string) => {
      let content = null;
      switch (sectionId) {
        case 'summary':
          if (personalDetails.summary) content = (
            <section>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-1 bg-blue-600"></div> Profile
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{personalDetails.summary}</p>
            </section>
          );
          break;
        case 'experience':
          if (experience.length > 0) content = (
            <section>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-1 bg-blue-600"></div> Experience
              </h2>
              <div className="flex flex-col gap-6">
                {experience.map((exp, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-gray-200 break-inside-avoid">
                    <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1"></div>
                    <h3 className="text-md font-bold text-gray-900">{exp.role}</h3>
                    <div className="flex text-sm text-gray-500 mb-2 font-medium">
                      <span>{exp.company}</span>
                      <span className="mx-2">•</span>
                      <span>{exp.duration}</span>
                    </div>
                    <ul className="list-disc list-outside ml-4 text-[13px] text-gray-700 space-y-1">
                      {exp.responsibilities.filter(r => r.trim()).map((r, j) => <li key={j}>{r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
          break;
        case 'education':
          if (education.length > 0) content = (
            <section>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-1 bg-blue-600"></div> Education
              </h2>
              {education.map((edu, i) => (
                <div key={i} className="mb-4">
                  <h3 className="text-md font-bold text-gray-900">{edu.degree}</h3>
                  <div className="flex text-sm text-gray-500 mb-1 font-medium">
                      <span>{edu.institution}</span>
                      <span className="mx-2">•</span>
                      <span>{edu.duration}</span>
                  </div>
                </div>
              ))}
            </section>
          );
          break;
        case 'projects':
          if (projects && projects.length > 0) content = (
            <section>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-1 bg-blue-600"></div> Projects
              </h2>
              {projects.map((proj, i) => (
                <div key={i} className="mb-4">
                  <h3 className="text-md font-bold text-gray-900">{proj.name}</h3>
                  <div className="flex text-sm text-gray-500 mb-1 font-medium">
                      <span>{proj.role}</span>
                      <span className="mx-2">•</span>
                      <span>{proj.duration}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </section>
          );
          break;
        case 'certifications':
          if (certifications && certifications.length > 0) content = (
            <section>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-1 bg-blue-600"></div> Certifications
              </h2>
              {certifications.map((cert, i) => (
                <div key={i} className="mb-4">
                  <h3 className="text-md font-bold text-gray-900">{cert.name}</h3>
                  <div className="flex text-sm text-gray-500 font-medium">
                      <span>{cert.issuer}</span>
                      {cert.date && <><span className="mx-2">•</span><span>{cert.date}</span></>}
                  </div>
                </div>
              ))}
            </section>
          );
          break;
        default:
          const customSec = customSections?.find(c => c.id === sectionId);
          if (customSec && customSec.items.length > 0) content = (
            <section>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-1 bg-blue-600"></div> {customSec.title}
              </h2>
              {customSec.items.map((item, i) => (
                <div key={i} className="mb-4">
                  <h3 className="text-md font-bold text-gray-900">{item.title}</h3>
                  <div className="flex text-sm text-gray-500 mb-1 font-medium">
                      {item.subtitle && <span>{item.subtitle}</span>}
                      {item.subtitle && item.date && <span className="mx-2">•</span>}
                      {item.date && <span>{item.date}</span>}
                  </div>
                  {item.description && <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>}
                </div>
              ))}
            </section>
          );
          break;
      }

      if (content) {
         return (
             <React.Fragment key={sectionId}>
                {content}
                {pageBreaks?.[sectionId] && <div className="break-after-page clear-both w-full" style={{ pageBreakAfter: 'always', width: '100%' }}></div>}
             </React.Fragment>
         );
      }
      return null;
  };

  return (
    <div className={`${fontFamily || 'font-sans'} text-gray-800 bg-white min-h-[1056px] w-[816px] box-border relative flex flex-row shadow-sm transition-all duration-200`}>
      <div className="w-1/3 bg-gray-100 p-8 flex flex-col gap-8 break-inside-avoid shadow-inner">
        {(!pageIndex || pageIndex === 0) && (
        <>
          <div className="flex flex-col items-center text-center">
            {showProfilePicture && personalDetails.profilePictureUrl && (
              <img src={personalDetails.profilePictureUrl} alt="Profile" className="w-32 h-32 rounded-full mb-4 border-4 border-white shadow-sm object-cover" />
            )}
            <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tight">{personalDetails.name}</h1>
            <p className="text-sm font-semibold text-blue-600 mt-1 uppercase tracking-wider">{personalDetails.title}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-200">Contact</h3>
            <ul className="text-sm space-y-2 break-all">
              {personalDetails.email && <li>{personalDetails.email}</li>}
              {personalDetails.phone && <li>{personalDetails.phone}</li>}
              {personalDetails.location && <li>{personalDetails.location}</li>}
              {personalDetails.linkedin && <li>{personalDetails.linkedin}</li>}
            </ul>
          </div>
        </>
        )}

        {skills.length > 0 && (sectionOrder || defaultOrder).includes('skills') && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-200">Skills</h3>
            <div className="flex flex-col gap-3 text-sm">
              {skills.map((grp, i) => (
                <div key={i}>
                  <p className="font-bold mb-1">{grp.category}</p>
                  <p className="text-gray-600 leading-relaxed">{grp.items.filter(s => s.trim()).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="w-2/3 p-10 flex flex-col gap-8">
        {(sectionOrder || defaultOrder).filter(s => s !== 'skills').map(sectionId => renderRightColumnSection(sectionId))}
      </div>
    </div>
  );
};

export const MinimalistTemplate: React.FC<TemplateProps> = ({ data, showProfilePicture, sectionOrder, fontFamily, pageBreaks, pageIndex }) => {
  const { personalDetails, experience, education, skills, projects, certifications, customSections } = data;
  
  const renderSec = (sectionId: string) => {
      let content = null;
      switch (sectionId) {
        case 'summary':
          if (personalDetails.summary) content = (
            <section className="mb-10">
              <p className="text-xs leading-loose text-gray-600 max-w-2xl">{personalDetails.summary}</p>
            </section>
          );
          break;
        case 'experience':
          if (experience.length > 0) content = (
            <section className="mb-10">
              <div className="grid grid-cols-[1fr_3fr] gap-6">
                <h2 className="text-sm font-bold uppercase text-gray-400 text-right mt-1">Experience</h2>
                <div className="flex flex-col gap-6">
                  {experience.map((exp, i) => (
                    <div key={i} className="break-inside-avoid">
                      <div className="flex items-end justify-between mb-2 border-b border-gray-100 pb-2">
                        <h3 className="text-sm font-bold">{exp.role} <span className="text-gray-400 font-normal ml-2">@ {exp.company}</span></h3>
                        <span className="text-xs text-gray-400">{exp.duration}</span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-2 list-none group">
                         {exp.responsibilities.filter(r => r.trim()).map((r, j) => (
                           <li key={j} className="flex gap-2">
                             <span className="text-gray-300">-</span> <span>{r}</span>
                           </li>
                         ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
          break;
        case 'skills':
          if (skills.length > 0) content = (
            <section className="mb-10">
              <div className="grid grid-cols-[1fr_3fr] gap-6">
                 <h2 className="text-sm font-bold uppercase text-gray-400 text-right">Skills</h2>
                 <div className="text-xs text-gray-600 flex flex-col gap-2">
                     {skills.map((s, i) => (
                       <div key={i}><span className="font-bold text-gray-800">{s.category}:</span> {s.items.join(', ')}</div>
                     ))}
                 </div>
              </div>
            </section>
          );
          break;
        case 'education':
          if (education.length > 0) content = (
            <section className="mb-10">
              <div className="grid grid-cols-[1fr_3fr] gap-6">
                 <h2 className="text-sm font-bold uppercase text-gray-400 text-right">Education</h2>
                 <div className="text-xs text-gray-600 flex flex-col gap-4">
                     {education.map((e, i) => (
                       <div key={i}>
                         <p className="font-bold text-gray-800">{e.degree}</p>
                         <p>{e.institution} ({e.duration})</p>
                       </div>
                     ))}
                 </div>
              </div>
            </section>
          );
          break;
        case 'projects':
          if (projects && projects.length > 0) content = (
            <section className="mb-10">
              <div className="grid grid-cols-[1fr_3fr] gap-6">
                 <h2 className="text-sm font-bold uppercase text-gray-400 text-right">Projects</h2>
                 <div className="text-xs text-gray-600 flex flex-col gap-4">
                     {projects.map((p, i) => (
                       <div key={i}>
                         <div className="flex justify-between mb-1">
                           <p className="font-bold text-gray-800">{p.name}</p>
                           <p>{p.duration}</p>
                         </div>
                         <p className="italic text-gray-500 mb-1">{p.role}</p>
                         <p className="leading-relaxed">{p.description}</p>
                       </div>
                     ))}
                 </div>
              </div>
            </section>
          );
          break;
        case 'certifications':
          if (certifications && certifications.length > 0) content = (
            <section className="mb-10">
              <div className="grid grid-cols-[1fr_3fr] gap-6">
                 <h2 className="text-sm font-bold uppercase text-gray-400 text-right">Certifications</h2>
                 <div className="text-xs text-gray-600 flex flex-col gap-4">
                     {certifications.map((c, i) => (
                       <div key={i}>
                         <div className="flex justify-between mb-1">
                           <p className="font-bold text-gray-800">{c.name}</p>
                           <p>{c.date}</p>
                         </div>
                         <p className="italic text-gray-500 mb-1">{c.issuer}</p>
                       </div>
                     ))}
                 </div>
              </div>
            </section>
          );
          break;
        default:
          const customSec = customSections?.find(c => c.id === sectionId);
          if (customSec && customSec.items.length > 0) content = (
            <section className="mb-10">
              <div className="grid grid-cols-[1fr_3fr] gap-6">
                 <h2 className="text-sm font-bold uppercase text-gray-400 text-right">{customSec.title}</h2>
                 <div className="text-xs text-gray-600 flex flex-col gap-4">
                     {customSec.items.map((item, i) => (
                       <div key={i}>
                         <div className="flex justify-between mb-1">
                           <p className="font-bold text-gray-800">{item.title}</p>
                           {item.date && <p>{item.date}</p>}
                         </div>
                         {item.subtitle && <p className="italic text-gray-500 mb-1">{item.subtitle}</p>}
                         {item.description && <p className="leading-relaxed">{item.description}</p>}
                       </div>
                     ))}
                 </div>
              </div>
            </section>
          );
          break;
      }
      
      if (content) {
         return (
             <React.Fragment key={sectionId}>
                {content}
                {pageBreaks?.[sectionId] && <div className="break-after-page clear-both w-full" style={{ pageBreakAfter: 'always', width: '100%' }}></div>}
             </React.Fragment>
         );
      }
      return null;
  };
  
  return (
    <div className={`${fontFamily || 'font-mono'} text-gray-800 bg-white p-12 min-h-[1056px] w-[816px] box-border relative shadow-sm transition-all duration-200`}>
      <header className="mb-10 flex gap-6 items-start">
        {showProfilePicture && personalDetails.profilePictureUrl && (
          <img src={personalDetails.profilePictureUrl} alt="Profile" className="w-20 h-20 rounded-md object-cover grayscale" />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-light tracking-tighter mb-1 truncate">{personalDetails.name}</h1>
          <p className="text-sm font-semibold text-gray-500">{personalDetails.title}</p>
          <div className="mt-4 text-xs text-gray-400 flex flex-wrap gap-4">
             {personalDetails.email && <span>{personalDetails.email}</span>}
             {personalDetails.phone && <span>{personalDetails.phone}</span>}
             {personalDetails.linkedin && <span>{personalDetails.linkedin}</span>}
          </div>
        </div>
      </header>

      {(sectionOrder || defaultOrder).map(sectionId => renderSec(sectionId))}
    </div>
  );
};

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data, showProfilePicture, sectionOrder, fontFamily, pageBreaks, pageIndex }) => {
  const { personalDetails, experience, education, skills, projects, certifications, customSections } = data;

  const renderSec = (sectionId: string) => {
      let content = null;
      switch (sectionId) {
        case 'summary':
          if (personalDetails.summary) content = (
            <div className="mb-8 text-sm leading-relaxed text-center px-4">
              <p>{personalDetails.summary}</p>
            </div>
          );
          break;
        case 'experience':
          if (experience.length > 0) content = (
             <div className="mb-6">
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.15em] border-y border-gray-300 py-1 mb-4 bg-gray-50">Professional Experience</h2>
                {experience.map((exp, i) => (
                  <div key={i} className="mb-5 break-inside-avoid">
                    <div className="flex justify-between items-baseline mb-1">
                       <h3 className="text-md font-bold">{exp.company} <span className="font-normal italic text-gray-600 ml-1">— {exp.location}</span></h3>
                       <span className="text-sm font-semibold">{exp.duration}</span>
                    </div>
                    <div className="font-semibold text-sm mb-2">{exp.role}</div>
                    <ul className="list-disc list-outside ml-6 text-[13px] space-y-1">
                       {exp.responsibilities.filter(r => r.trim()).map((r, j) => <li key={j}>{r}</li>)}
                    </ul>
                  </div>
                ))}
             </div>
          );
          break;
        case 'education':
          if (education.length > 0) content = (
             <div className="mb-6">
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.15em] border-y border-gray-300 py-1 mb-4 bg-gray-50">Education</h2>
                {education.map((edu, i) => (
                  <div key={i} className="mb-3 flex justify-between items-start break-inside-avoid">
                     <div>
                       <h3 className="text-sm font-bold">{edu.institution}</h3>
                       <p className="text-sm italic">{edu.degree}</p>
                     </div>
                     <div className="text-right">
                       <span className="text-sm block">{edu.location}</span>
                       <span className="text-sm block text-gray-600">{edu.duration}</span>
                     </div>
                  </div>
                ))}
             </div>
          );
          break;
        case 'skills':
          if (skills.length > 0) content = (
             <div className="mb-6">
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.15em] border-y border-gray-300 py-1 mb-4 bg-gray-50">Core Competencies</h2>
                <div className="grid grid-cols-1 gap-y-2 text-sm px-4">
                   {skills.map((s, i) => (
                     <div key={i} className="leading-relaxed">
                       <span className="font-bold mr-2">{s.category}:</span>
                       <span className="text-gray-800">{s.items.join(', ')}</span>
                     </div>
                   ))}
                </div>
             </div>
          );
          break;
        case 'projects':
          if (projects && projects.length > 0) content = (
             <div className="mb-6">
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.15em] border-y border-gray-300 py-1 mb-4 bg-gray-50">Selected Projects</h2>
                {projects.map((proj, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between items-baseline mb-1">
                       <h3 className="text-md font-bold">{proj.name}</h3>
                       <span className="text-sm font-semibold">{proj.duration}</span>
                    </div>
                    <div className="font-semibold text-sm mb-2">{proj.role}</div>
                    <p className="text-sm leading-relaxed">{proj.description}</p>
                  </div>
                ))}
             </div>
          );
          break;
        case 'certifications':
          if (certifications && certifications.length > 0) content = (
             <div className="mb-6">
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.15em] border-y border-gray-300 py-1 mb-4 bg-gray-50">Certifications</h2>
                {certifications.map((cert, i) => (
                  <div key={i} className="mb-3 flex justify-between items-start break-inside-avoid">
                     <div>
                       <h3 className="text-sm font-bold">{cert.name}</h3>
                       <p className="text-sm italic">{cert.issuer}</p>
                     </div>
                     <div className="text-right">
                       <span className="text-sm block">{cert.date}</span>
                     </div>
                  </div>
                ))}
             </div>
          );
          break;
        default:
          const customSec = customSections?.find(c => c.id === sectionId);
          if (customSec && customSec.items.length > 0) content = (
             <div className="mb-6">
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.15em] border-y border-gray-300 py-1 mb-4 bg-gray-50">{customSec.title}</h2>
                {customSec.items.map((item, i) => (
                  <div key={i} className="mb-4 break-inside-avoid">
                     <div className="flex justify-between items-baseline mb-1">
                       <h3 className="text-md font-bold">{item.title}</h3>
                       {item.date && <span className="text-sm font-semibold">{item.date}</span>}
                     </div>
                     {item.subtitle && <div className="font-semibold text-sm mb-1">{item.subtitle}</div>}
                     {item.description && <p className="text-sm leading-relaxed">{item.description}</p>}
                  </div>
                ))}
             </div>
          );
          break;
      }

      if (content) {
         return (
             <React.Fragment key={sectionId}>
                {content}
                {pageBreaks?.[sectionId] && <div className="break-after-page clear-both w-full" style={{ pageBreakAfter: 'always', width: '100%' }}></div>}
             </React.Fragment>
         );
      }
      return null;
  };

  return (
    <div className={`${fontFamily || 'font-serif'} text-[#2a2a2a] bg-white p-10 min-h-[1056px] w-[816px] box-border relative shadow-sm transition-all duration-200`}>
      <div className="text-center mb-8">
        {showProfilePicture && personalDetails.profilePictureUrl && (
          <img src={personalDetails.profilePictureUrl} alt="Profile" className="w-20 h-20 rounded-full mx-auto mb-4 border border-gray-400 object-cover" />
        )}
        <h1 className="text-3xl font-medium tracking-wide mb-1 truncate">{personalDetails.name}</h1>
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">{personalDetails.title}</p>
        <div className="flex justify-center items-center gap-3 text-xs text-gray-600 divider-dots flex-wrap">
           {personalDetails.email && <span>{personalDetails.email}</span>}
           {personalDetails.phone && <span>{personalDetails.phone}</span>}
           {personalDetails.location && <span>{personalDetails.location}</span>}
           {personalDetails.linkedin && <span>{personalDetails.linkedin}</span>}
        </div>
      </div>

      {(sectionOrder || defaultOrder).map(sectionId => renderSec(sectionId))}
    </div>
  );
};

export const AestheticTemplate: React.FC<TemplateProps> = ({ data, showProfilePicture, sectionOrder, fontFamily, aestheticTheme, pageBreaks, pageIndex }) => {
  const { personalDetails, experience, education, skills, projects } = data;
  const theme = aestheticThemesData[aestheticTheme || 'default'] || aestheticThemesData.default;

  return (
    <div className={`${fontFamily || 'font-sans'} text-gray-800 ${theme.bg} min-h-[1056px] w-[816px] box-border relative shadow-sm transition-all duration-200 ${theme.sel}`}>
      {/* Decorative background elements */}
      <div className={`absolute top-0 right-0 w-64 h-64 ${theme.shape1} rounded-bl-[100px] -z-0 opacity-50`}></div>
      <div className={`absolute bottom-0 left-0 w-48 h-48 ${theme.shape2} rounded-tr-[80px] -z-0 opacity-50`}></div>

      <div className="relative z-10 px-12 py-12 flex flex-col h-full gap-8">
        {(!pageIndex || pageIndex === 0) && (
        <header className="flex gap-8 items-center border-b-[3px] border-gray-900 pb-8">
          {showProfilePicture && personalDetails.profilePictureUrl ? (
            <img src={personalDetails.profilePictureUrl} alt="Profile" className="w-28 h-28 rounded-[2rem] object-cover shadow-md rotate-3 border-4 border-white" />
          ) : (
            <div className="w-28 h-28 aspect-square rounded-[2rem] bg-gray-900 text-white flex items-center justify-center rotate-3 font-black text-4xl shadow-md border-4 border-white">
               {personalDetails.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-5xl font-black tracking-tight text-gray-900 mb-2 leading-none uppercase">{personalDetails.name}</h1>
            <p className={`text-xl font-bold ${theme.textMainHighlight} block mb-4 tracking-wide`}>{personalDetails.title}</p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
               {personalDetails.email && <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100"><Mail className="w-3.5 h-3.5 text-gray-400" /> {personalDetails.email}</span>}
               {personalDetails.phone && <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100"><Phone className="w-3.5 h-3.5 text-gray-400" /> {personalDetails.phone}</span>}
               {personalDetails.location && <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {personalDetails.location}</span>}
               {personalDetails.linkedin && <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100"><Linkedin className="w-3.5 h-3.5 text-gray-400" /> {personalDetails.linkedin}</span>}
            </div>
          </div>
        </header>
        )}

        {/* Content Section */}
        <div className="grid grid-cols-[1fr_2.2fr] gap-10">
          
          {/* Left Column (Skills, Education) */}
          <div className="flex flex-col gap-8">
             {(sectionOrder || defaultOrder).filter(sec => sec === 'skills' || sec === 'education').map(sectionId => {
               if (sectionId === 'skills' && skills.length > 0) return (
                 <React.Fragment key="skills">
                   <section>
                     <h2 className="text-lg font-black uppercase text-gray-900 mb-4 flex items-center gap-2">
                       <div className={`w-8 h-8 rounded-lg ${theme.icon1Bg} flex items-center justify-center ${theme.icon1Text}`}><Code className="w-4 h-4" /></div> Skills
                     </h2>
                     <div className="flex flex-col gap-4">
                       {skills.map((s, i) => (
                         <div key={i}>
                           <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{s.category}</h3>
                           <div className="flex flex-wrap gap-1.5">
                             {s.items.map((item, j) => (
                               <span key={j} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md font-medium text-gray-700 shadow-sm">{item}</span>
                             ))}
                           </div>
                         </div>
                       ))}
                     </div>
                   </section>
                   {pageBreaks?.['skills'] && <div className="break-after-page clear-both w-full" style={{ pageBreakAfter: 'always', width: '100%' }}></div>}
                 </React.Fragment>
               );
               if (sectionId === 'education' && education.length > 0) return (
                 <React.Fragment key="education">
                   <section>
                     <h2 className="text-lg font-black uppercase text-gray-900 mb-4 flex items-center gap-2">
                       <div className={`w-8 h-8 rounded-lg ${theme.icon2Bg} flex items-center justify-center ${theme.icon2Text}`}><GraduationCap className="w-4 h-4" /></div> Edu
                     </h2>
                     <div className="flex flex-col gap-4 relative before:absolute before:inset-y-2 before:left-[3px] before:w-[2px] before:bg-gray-200 pl-4">
                       {education.map((e, i) => (
                         <div key={i} className="relative">
                           <div className={`absolute w-2 h-2 ${theme.eduDot} rounded-full -left-[21px] top-1.5 border-[2px] border-white box-content`}></div>
                           <h3 className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{e.degree}</h3>
                           <p className="text-xs font-semibold text-gray-600">{e.institution}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{e.duration}</p>
                         </div>
                       ))}
                     </div>
                   </section>
                   {pageBreaks?.['education'] && <div className="break-after-page clear-both w-full" style={{ pageBreakAfter: 'always', width: '100%' }}></div>}
                 </React.Fragment>
               );
               return null;
             })}
          </div>

          {/* Right Column (Summary, Experience, Projects) */}
          <div className="flex flex-col gap-8">
             {(sectionOrder || defaultOrder).filter(sec => sec !== 'skills' && sec !== 'education').map(sectionId => {
               let content = null;
               switch (sectionId) {
                 case 'summary':
                   if (personalDetails.summary) content = (
                     <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                       <div className={`absolute top-0 left-0 w-1 h-full ${theme.accentLine}`}></div>
                       <p className="text-sm leading-relaxed text-gray-600 italic">"{personalDetails.summary}"</p>
                     </section>
                   );
                   break;
                 case 'experience':
                   if (experience.length > 0) content = (
                     <section>
                       <h2 className="text-lg font-black uppercase text-gray-900 mb-5 flex items-center gap-2">
                         <div className={`w-8 h-8 rounded-lg ${theme.icon3Bg} flex items-center justify-center ${theme.icon3Text}`}><Briefcase className="w-4 h-4" /></div> Work Experience
                       </h2>
                       <div className="flex flex-col gap-6">
                         {experience.map((exp, i) => (
                           <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm break-inside-avoid">
                             <div className="flex justify-between items-start mb-2">
                               <div>
                                 <h3 className="text-md font-bold text-gray-900">{exp.role}</h3>
                                 <p className={`text-sm font-semibold ${theme.icon3Text}`}>{exp.company}</p>
                               </div>
                               <div className="text-right">
                                 <span className="text-[10px] font-bold tracking-widest uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded-md block mb-1">{exp.duration}</span>
                               </div>
                             </div>
                             <ul className={`list-disc list-outside ml-4 text-xs text-gray-600 space-y-1.5 ${theme.bulletPill}`}>
                                {exp.responsibilities.filter(r => r.trim()).map((r, j) => <li key={j}>{r}</li>)}
                             </ul>
                           </div>
                         ))}
                       </div>
                     </section>
                   );
                   break;
                 case 'projects':
                   if (projects && projects.length > 0) content = (
                     <section>
                       <h2 className="text-lg font-black uppercase text-gray-900 mb-5 flex items-center gap-2">
                         <div className={`w-8 h-8 rounded-lg ${theme.icon4Bg} flex items-center justify-center ${theme.icon4Text}`}><LayoutTemplate className="w-4 h-4" /></div> Projects
                       </h2>
                       <div className="grid grid-cols-2 gap-4">
                         {projects.map((proj, i) => (
                           <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col break-inside-avoid">
                             <h3 className="text-sm font-bold text-gray-900 mb-1">{proj.name}</h3>
                             <p className={`text-[10px] uppercase tracking-wider ${theme.projRole} font-bold mb-2`}>{proj.role}</p>
                             <p className="text-xs text-gray-600 leading-snug flex-1">{proj.description}</p>
                           </div>
                         ))}
                       </div>
                     </section>
                   );
                   break;
                 case 'certifications':
                   if (data.certifications && data.certifications.length > 0) content = (
                     <section>
                       <h2 className="text-lg font-black uppercase text-gray-900 mb-5 flex items-center gap-2">
                         <div className={`w-8 h-8 rounded-lg ${theme.icon4Bg} flex items-center justify-center ${theme.icon4Text}`}><LayoutTemplate className="w-4 h-4" /></div> Certifications
                       </h2>
                       <div className="flex flex-col gap-4">
                         {data.certifications.map((cert, i) => (
                           <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm break-inside-avoid">
                             <div className="flex justify-between items-baseline">
                               <h3 className="text-sm font-bold text-gray-900 mb-1">{cert.name}</h3>
                               <span className="text-[10px] uppercase font-bold text-gray-400">{cert.date}</span>
                             </div>
                             <p className="text-[12px] font-semibold text-gray-600">{cert.issuer}</p>
                           </div>
                         ))}
                       </div>
                     </section>
                   );
                   break;
                 default:
                   const customSec = data.customSections?.find(c => c.id === sectionId);
                   if (customSec && customSec.items.length > 0) content = (
                     <section>
                       <h2 className="text-lg font-black uppercase text-gray-900 mb-5 flex items-center gap-2">
                         <div className={`w-8 h-8 rounded-lg ${theme.icon4Bg} flex items-center justify-center ${theme.icon4Text}`}><LayoutTemplate className="w-4 h-4" /></div> {customSec.title}
                       </h2>
                       <div className="flex flex-col gap-4">
                         {customSec.items.map((item, i) => (
                           <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm break-inside-avoid">
                             <div className="flex justify-between items-baseline mb-1">
                               <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                               <span className="text-[10px] uppercase font-bold text-gray-400">{item.date}</span>
                             </div>
                             {item.subtitle && <p className="text-[12px] font-semibold text-gray-600">{item.subtitle}</p>}
                             {item.description && <p className="text-xs text-gray-600 mt-2">{item.description}</p>}
                           </div>
                         ))}
                       </div>
                     </section>
                   );
                   break;
               }

               if (content) {
                 return (
                   <React.Fragment key={sectionId}>
                     {content}
                     {pageBreaks?.[sectionId] && <div className="break-after-page clear-both w-full" style={{ pageBreakAfter: 'always', width: '100%' }}></div>}
                   </React.Fragment>
                 );
               }
               return null;
             })}
          </div>

        </div>
      </div>
    </div>
  );
};

export const TemplateRenderer: React.FC<{ template: TemplateId } & TemplateProps> = ({ template, data, showProfilePicture, sectionOrder, fontFamily, aestheticTheme, pageBreaks, pageIndex }) => {
  switch (template) {
    case 'aesthetic':
      return <AestheticTemplate data={data} showProfilePicture={showProfilePicture} sectionOrder={sectionOrder} fontFamily={fontFamily} aestheticTheme={aestheticTheme} pageBreaks={pageBreaks} pageIndex={pageIndex} />;
    case 'modern':
      return <ModernTemplate data={data} showProfilePicture={showProfilePicture} sectionOrder={sectionOrder} fontFamily={fontFamily} pageBreaks={pageBreaks} pageIndex={pageIndex} />;
    case 'minimalist':
      return <MinimalistTemplate data={data} showProfilePicture={showProfilePicture} sectionOrder={sectionOrder} fontFamily={fontFamily} pageBreaks={pageBreaks} pageIndex={pageIndex} />;
    case 'executive':
      return <ExecutiveTemplate data={data} showProfilePicture={showProfilePicture} sectionOrder={sectionOrder} fontFamily={fontFamily} pageBreaks={pageBreaks} pageIndex={pageIndex} />;
    case 'classic':
    default:
      return <ClassicTemplate data={data} showProfilePicture={showProfilePicture} sectionOrder={sectionOrder} fontFamily={fontFamily} pageBreaks={pageBreaks} pageIndex={pageIndex} />;
  }
};
