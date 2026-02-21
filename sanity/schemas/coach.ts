import { defineType, defineField } from "sanity";

export const coach = defineType({
  name: "coach",
  title: "Coach",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role / Title",
      type: "localeString",
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "localeRichText",
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "calendlyUrl",
      title: "Calendly URL",
      type: "url",
      description: "Personal Calendly link for sparring sessions",
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn URL",
      type: "url",
    }),
    defineField({
      name: "languages",
      title: "Languages",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Deutsch", value: "de" },
          { title: "English", value: "en" },
          { title: "Русский", value: "ru" },
        ],
      },
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role.de",
      media: "photo",
    },
  },
});
