import { defineType, defineField } from "sanity";

export const framework = defineType({
  name: "framework",
  title: "Framework",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.de", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "localeString",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localeRichText",
    }),
    defineField({
      name: "image",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "downloadFile",
      title: "Download File (PDF/Workbook)",
      type: "file",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "previewImage",
      title: "Preview Image",
      type: "image",
      description: "Preview of the framework content for the landing page",
      options: { hotspot: true },
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "relatedProgram",
      title: "Related Program",
      type: "reference",
      to: [{ type: "program" }],
      description: "Upsell: which program does this framework belong to?",
    }),
    defineField({
      name: "requiresEmail",
      title: "Requires Email for Download",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Sort Order",
      type: "number",
    }),
  ],
  preview: {
    select: {
      title: "title.de",
      subtitle: "subtitle.de",
      media: "image",
    },
  },
});
