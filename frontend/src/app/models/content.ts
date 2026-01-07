import { BenchmarkResult } from "./benchmarks";
import { ProblemSolutionCard } from "./problem-solution";
import { WorkflowStep } from "./workflow-step";

export interface PageMeta {
  title: string;       // Browser Tab Title
  description: string; // SEO Description
}

export interface HomeSection {
  meta: PageMeta;
  hero: { 
    badge: string;
    h1: string; 
    subtext: string;
    ctaSearch: string;
    ctaArchitecture: string;
  };
  searchDemo: {
    title: string;
    description: string;
    inputPlaceholder: string;
    button: string;
    status: {
      loading: string;
      waitingSearch: string;
      noResults: string;
      resultsFound: string;
      metrics: { algo : string; db: string }
    };
  };
  teaser: { 
    text: string; 
    linkText: string; 
  };
}

export interface ArchitectureSection {
  meta: PageMeta;
  hero: {
    title: string;
    description: string;
  }
  problemSolution: ProblemSolutionCard[];
  workflow: {
    title: string;
    steps: WorkflowStep[];
  };
  stats: {
    title: string;
    items: BenchmarkResult[];
  }
  authorAndContact: {
    title: string;
    bio: string;
    status: {
      label: string;
      value: string;
      indicatorColor: string;
    }
    cta: {
      text: string;
      email: string;  
      buttonText: string;
    }
  }
}

export interface SearchSection {
  meta: PageMeta;
  placeholder: string;
  results: string;
}

export interface AppContent {
  // Shared stuff (Nav, Footer)
  common: {
    nav: { home: string; architecture: string;  };
    footer: {
      builtWith: string;
      copyright: string;
      links: Array<{ label: string; url: string; }>;
    };
  };
  // Pages
  home: HomeSection;
  architecture: ArchitectureSection;
}