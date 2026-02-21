import { groq } from "next-sanity";

// ============================================================
// PROGRAMS
// ============================================================

export const allProgramsQuery = groq`
  *[_type == "program" && isPublished == true] | order(order asc) {
    _id,
    title,
    slug,
    subtitle,
    image,
    programType,
    duration,
    format,
    "phaseCount": count(phases),
    coaches[]-> { name, slug, photo }
  }
`;

export const programBySlugQuery = groq`
  *[_type == "program" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    subtitle,
    description,
    image,
    programType,
    duration,
    format,
    phases[]-> {
      _id,
      title,
      slug,
      description,
      order,
      image,
      steps[]-> {
        _id,
        title,
        slug,
        stepType,
        order,
        description,
        estimatedMinutes,
        prerequisites[]-> { _id, title, slug }
      }
    } | order(order asc),
    coaches[]-> { _id, name, slug, role, photo, calendlyUrl },
    testimonials[]-> { name, role, company, quote, photo, rating }
  }
`;

// ============================================================
// FRAMEWORKS
// ============================================================

export const allFrameworksQuery = groq`
  *[_type == "framework" && isPublished == true] | order(order asc) {
    _id,
    title,
    slug,
    subtitle,
    image,
    previewImage,
    requiresEmail,
    category-> { title, slug, color },
    relatedProgram-> { title, slug }
  }
`;

export const frameworkBySlugQuery = groq`
  *[_type == "framework" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    subtitle,
    description,
    image,
    previewImage,
    "downloadUrl": downloadFile.asset->url,
    requiresEmail,
    category-> { title, slug, color },
    relatedProgram-> { title, slug, subtitle }
  }
`;

// ============================================================
// BLOG
// ============================================================

export const allBlogPostsQuery = groq`
  *[_type == "blogPost" && isPublished == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    publishedAt,
    author-> { name, slug, photo },
    categories[]-> { title, slug, color }
  }
`;

export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    body,
    coverImage,
    publishedAt,
    author-> { name, slug, photo, bio },
    categories[]-> { title, slug, color },
    relatedProgram-> { title, slug },
    seo
  }
`;

export const blogPostsByCategoryQuery = groq`
  *[_type == "blogPost" && isPublished == true && $categoryId in categories[]._ref] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    publishedAt,
    author-> { name, slug, photo },
    categories[]-> { title, slug, color }
  }
`;

// ============================================================
// CATEGORIES
// ============================================================

export const allCategoriesQuery = groq`
  *[_type == "category"] | order(title.de asc) {
    _id,
    title,
    slug,
    description,
    color
  }
`;

// ============================================================
// COACHES
// ============================================================

export const allCoachesQuery = groq`
  *[_type == "coach" && isActive == true] {
    _id,
    name,
    slug,
    role,
    photo,
    languages,
    linkedinUrl
  }
`;

export const coachBySlugQuery = groq`
  *[_type == "coach" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    role,
    bio,
    photo,
    email,
    calendlyUrl,
    linkedinUrl,
    languages
  }
`;

// ============================================================
// SITE SETTINGS
// ============================================================

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    logo,
    favicon,
    ogImage,
    socialLinks,
    contactEmail,
    contactPhone,
    address
  }
`;

// ============================================================
// PROGRAM STEP DETAIL (for portal)
// ============================================================

export const stepDetailQuery = groq`
  *[_type == "programStep" && slug.current == $stepSlug][0] {
    _id,
    title,
    slug,
    stepType,
    order,
    description,
    estimatedMinutes,
    videoUrl,
    content,
    downloads[] { label, "url": asset->url },
    checklist,
    "workbookTemplateUrl": workbookTemplate.asset->url,
    workbookInstructions,
    acceptedFileTypes,
    sparringCoach-> { _id, name, photo, calendlyUrl },
    sparringDurationMinutes,
    sparringDescription,
    prerequisites[]-> { _id, title, slug, stepType }
  }
`;
