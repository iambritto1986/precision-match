export interface PersonalDetails {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  profilePictureUrl?: string; // Stored as base64 or blob URL
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  location: string;
  responsibilities: string[];
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
  location: string;
  details: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Project {
  name: string;
  role: string;
  duration: string;
  description: string;
  url?: string;
}

export interface CustomSectionItem {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface ResumeData {
  personalDetails: PersonalDetails;
  experience: Experience[];
  education: Education[];
  skills: SkillCategory[];
  certifications?: Certification[];
  projects?: Project[];
  customSections?: CustomSection[];
}

export type TemplateId = 'classic' | 'modern' | 'minimalist' | 'executive' | 'aesthetic';

export interface AppState {
  step: 'onboarding' | 'editor';
  baseContext: string; // The extracted text from old resume or their scratch input
  jobDescription: string;
  resumeData: ResumeData | null;
  coverLetterText: string | null;
  selectedTemplate: TemplateId;
  showProfilePicture: boolean;
  isGenerating: boolean;
}
