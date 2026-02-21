import { localeString, localeText, localeRichText } from "./locale";
import { program } from "./program";
import { programPhase } from "./programPhase";
import { programStep } from "./programStep";
import { framework } from "./framework";
import { blogPost } from "./blogPost";
import { category } from "./category";
import { coach } from "./coach";
import { testimonial } from "./testimonial";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  // Locale types (must be first)
  localeString,
  localeText,
  localeRichText,
  // Documents
  program,
  programPhase,
  programStep,
  framework,
  blogPost,
  category,
  coach,
  testimonial,
  siteSettings,
];
