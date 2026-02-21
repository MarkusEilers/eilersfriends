import { defineType, defineField } from "sanity";

export const program = defineType({
  name: "program",
  title: "Program",
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
      name: "programType",
      title: "Program Type",
      type: "string",
      options: {
        list: [
          { title: "Group Training", value: "group" },
          { title: "1:1 Coaching", value: "coaching" },
          { title: "Workshop", value: "workshop" },
          { title: "Hybrid", value: "hybrid" },
        ],
      },
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "localeString",
      description: "e.g. '12 Wochen' / '12 weeks'",
    }),
    defineField({
      name: "format",
      title: "Format",
      type: "localeString",
      description: "e.g. 'Online + Präsenz' / 'Online + In-person'",
    }),
    defineField({
      name: "phases",
      title: "Phases",
      type: "array",
      of: [{ type: "reference", to: [{ type: "programPhase" }] }],
    }),
    defineField({
      name: "coaches",
      title: "Coaches",
      type: "array",
      of: [{ type: "reference", to: [{ type: "coach" }] }],
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      of: [{ type: "reference", to: [{ type: "testimonial" }] }],
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
      subtitle: "programType",
      media: "image",
    },
  },
});
