import { defineType, defineField } from "sanity";

export const programPhase = defineType({
  name: "programPhase",
  title: "Program Phase",
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
      name: "description",
      title: "Description",
      type: "localeText",
    }),
    defineField({
      name: "order",
      title: "Phase Order",
      type: "number",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "steps",
      title: "Steps",
      type: "array",
      of: [{ type: "reference", to: [{ type: "programStep" }] }],
    }),
    defineField({
      name: "image",
      title: "Phase Image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  orderings: [
    {
      title: "Phase Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title.de",
      order: "order",
    },
    prepare({ title, order }) {
      return {
        title: `Phase ${order}: ${title}`,
      };
    },
  },
});
